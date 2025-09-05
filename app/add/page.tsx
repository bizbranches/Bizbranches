"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ChevronsUpDown, MapPin, Building, User, Phone, Mail, MessageSquare, Globe, Camera } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface FormState {
  businessName: string
  contactPersonName: string
  category: string
  subCategory?: string
  province: string
  city: string
  postalCode?: string
  address: string
  phone: string
  whatsapp?: string
  email: string
  description: string
  logoFile?: File | null
  websiteUrl?: string
  facebookUrl?: string
  gmbUrl?: string
  youtubeUrl?: string
}

const defaultCategories = ["Restaurant", "Retail", "Services", "Healthcare", "Education", "Technology"]

export function AddBusinessForm({
  title = "List Your Business",
  description = "Join our directory and reach more customers",
  categories = defaultCategories,
  onSubmitted,
}: {
  title?: string
  description?: string
  categories?: string[]
  onSubmitted?: () => void
}) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(0)
  const DESCRIPTION_MAX = 500
  const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
  
  // Local categories to support creating new ones on the fly
  const [localCategories, setLocalCategories] = useState<string[]>(categories)
  useEffect(() => setLocalCategories(categories), [categories])
  
  // Fetch categories from API (with session cache) so newly added categories appear in dropdown
  const fetchCategories = async () => {
    const now = Date.now()
    try {
      // Try sessionStorage first
      try {
        const raw = sessionStorage.getItem("add:categories")
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed?.data) && typeof parsed?.ts === "number" && (now - parsed.ts) < CACHE_TTL_MS) {
            setLocalCategories(parsed.data)
            return
          }
        }
      } catch {}

      // Network as fallback (use cache where possible, API has ISR headers)
      const res = await fetch("/api/categories?limit=60", { cache: "force-cache" })
      const data = await res.json().catch(() => ({}))
      const list: string[] = Array.isArray(data?.categories)
        ? data.categories.map((c: any) => c?.name || c?.slug).filter(Boolean)
        : []
      if (list.length) {
        setLocalCategories(list)
        try { sessionStorage.setItem("add:categories", JSON.stringify({ ts: now, data: list })) } catch {}
      }
    } catch {
      // ignore
    }
  }
  
  useEffect(() => {
    fetchCategories()
  }, [])
  
  // Category combobox state
  const [catOpen, setCatOpen] = useState(false)
  const [catQuery, setCatQuery] = useState("")
  const filteredCategories = useMemo(() => {
    const q = catQuery.trim().toLowerCase()
    if (!q) return localCategories
    return localCategories.filter((c) => c.toLowerCase().includes(q))
  }, [catQuery, localCategories])
  // Refresh categories when category popover opens
  useEffect(() => {
    if (catOpen) fetchCategories()
  }, [catOpen])
  
  // Subcategory combobox state
  const [subCatOpen, setSubCatOpen] = useState(false)
  const [subCatQuery, setSubCatQuery] = useState("")
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([])
  const [subCatLoading, setSubCatLoading] = useState(false)
  const filteredSubCategories = useMemo(() => {
    const q = subCatQuery.trim().toLowerCase()
    if (!q) return subCategoryOptions
    return subCategoryOptions.filter((s) => s.toLowerCase().includes(q))
  }, [subCatQuery, subCategoryOptions])
  
  // Province/City combobox state and data
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [provinces, setProvinces] = useState<Array<{ id: string; name: string }>>([])
  const [cityOptions, setCityOptions] = useState<Array<{ id: string; name: string }>>([])
  const [provLoading, setProvLoading] = useState(false)
  const [cityLoading, setCityLoading] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase()
    if (!q) return cityOptions
    return cityOptions.filter((c) => c.name.toLowerCase().includes(q))
  }, [cityQuery, cityOptions])
  
  const [form, setForm] = useState<FormState>({
    businessName: "",
    contactPersonName: "",
    category: "",
    subCategory: "",
    province: "",
    city: "",
    postalCode: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    description: "",
    logoFile: null,
    websiteUrl: "",
    facebookUrl: "",
    gmbUrl: "",
    youtubeUrl: "",
  })

  // Helper to slugify category to request subcategories from API
  const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")

  // Fetch subcategories for current category
  const fetchSubcategories = async () => {
    const cat = form.category?.trim()
    if (!cat) {
      setSubCategoryOptions([])
      return
    }
    try {
      setSubCatLoading(true)
      const res = await fetch(`/api/categories?slug=${encodeURIComponent(toSlug(cat))}`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      const list: string[] = Array.isArray(data?.category?.subcategories)
        ? data.category.subcategories.map((s: any) => s?.name || s?.slug).filter(Boolean)
        : []
      setSubCategoryOptions(list)
    } catch (e) {
      setSubCategoryOptions([])
    } finally {
      setSubCatLoading(false)
    }
  }

  // Load subcategories when category changes
  useEffect(() => { fetchSubcategories() }, [form.category])
  // Refresh subcategories when subcategory popover opens
  useEffect(() => { if (subCatOpen) fetchSubcategories() }, [subCatOpen])

  // Listen to cross-tab/category-page changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "categories:version") {
        fetchCategories()
        fetchSubcategories()
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchCategories()
        fetchSubcategories()
      }
    }
    window.addEventListener("storage", onStorage)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("storage", onStorage)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  // Calculate form completion percentage
  const completionPercentage = useMemo(() => {
    const requiredFields = [
      form.businessName,
      form.contactPersonName,
      form.category,
      form.province,
      form.city,
      form.address,
      form.phone,
      form.email,
      form.description,
      form.logoFile
    ];
    
    const filledCount = requiredFields.filter(field => 
      field !== null && field !== undefined && field !== ''
    ).length;
    
    return Math.round((filledCount / requiredFields.length) * 100);
  }, [form]);

  // Load provinces (with session cache)
  useEffect(() => {
    const run = async () => {
      try {
        setProvLoading(true)
        const now = Date.now()
        let loaded: Array<{ id: string; name: string }> | null = null
        try {
          const raw = sessionStorage.getItem("add:provinces")
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed?.data) && typeof parsed?.ts === "number" && (now - parsed.ts) < CACHE_TTL_MS) {
              loaded = parsed.data
            }
          }
        } catch {}
        if (!loaded) {
          const res = await fetch("/api/provinces", { cache: "force-cache" })
          const data = await res.json()
          loaded = Array.isArray(data) ? data : data?.provinces ?? []
          try { sessionStorage.setItem("add:provinces", JSON.stringify({ ts: now, data: loaded })) } catch {}
        }
        setProvinces(loaded ?? [])
      } catch (e) {
        setProvinces([])
      } finally {
        setProvLoading(false)
      }
    }
    run()
  }, [])

  // Do not load all cities initially; fetch when a province is selected

  const fetchCitiesByProvince = async (provinceId: string) => {
    try {
      setCityLoading(true)
      const now = Date.now()
      const cacheKey = `add:cities:${provinceId}`
      let loaded: Array<{ id: string; name: string }> | null = null
      try {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed?.data) && typeof parsed?.ts === "number" && (now - parsed.ts) < CACHE_TTL_MS) {
            loaded = parsed.data
          }
        }
      } catch {}
      if (!loaded) {
        const res = await fetch(`/api/cities?provinceId=${encodeURIComponent(provinceId)}`, { cache: "force-cache" })
        const data = await res.json()
        loaded = Array.isArray(data) ? data : data?.cities ?? []
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: now, data: loaded })) } catch {}
      }
      setCityOptions(loaded ?? [])
    } catch (e) {
      setCityOptions([])
    } finally {
      setCityLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setForm((prev) => ({ ...prev, logoFile: file }))
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
    } else {
      setLogoPreview(null)
    }
  }

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })

  const validate = () => {
    const friendlyLabels: Record<string, { label: string; inputId: string }> = {
      businessName: { label: "Business Name", inputId: "businessName" },
      contactPersonName: { label: "Contact Person", inputId: "contactPersonName" },
      category: { label: "Category", inputId: "category" },
      province: { label: "Province", inputId: "province" },
      city: { label: "City", inputId: "city" },
      address: { label: "Complete Address", inputId: "address" },
      phone: { label: "Phone Number", inputId: "phone" },
      email: { label: "Email Address", inputId: "email" },
      description: { label: "Business Description", inputId: "description" },
      logo: { label: "Business Logo", inputId: "logo" },
    }

    const required = [
      ["businessName", form.businessName],
      ["contactPersonName", form.contactPersonName],
      ["category", form.category],
      ["province", form.province],
      ["city", form.city],
      ["address", form.address],
      ["phone", form.phone],
      ["email", form.email],
      ["description", form.description],
    ] as const

    const missingKeys = required.filter(([, v]) => !v || String(v).trim() === "").map(([k]) => k as string)
    if (!form.logoFile) missingKeys.push("logo")

    if (missingKeys.length) {
      const friendlyList = missingKeys
        .map((k) => friendlyLabels[k]?.label || k)
        .join(", ")

      toast({
        title: "Please fill all required fields",
        description: friendlyList,
        variant: "destructive",
      })

      // Try to focus/scroll to first missing input
      const firstKey = missingKeys[0]
      const inputId = friendlyLabels[firstKey]?.inputId || firstKey
      const el = document.getElementById(inputId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        ;(el as HTMLElement).focus?.()
      }
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      // Build multipart/form-data to match /api/business expectations
      const fd = new FormData()
      fd.append("name", form.businessName)
      fd.append("contactPerson", form.contactPersonName)
      fd.append("category", form.category)
      if (form.subCategory) fd.append("subCategory", form.subCategory)
      fd.append("province", form.province)
      fd.append("city", form.city)
      if (form.postalCode) fd.append("postalCode", form.postalCode)
      fd.append("address", form.address)
      fd.append("phone", form.phone)
      fd.append("whatsapp", form.whatsapp || "")
      fd.append("email", form.email)
      fd.append("description", form.description)
      if (form.websiteUrl) fd.append("websiteUrl", form.websiteUrl)
      if (form.facebookUrl) fd.append("facebookUrl", form.facebookUrl)
      if (form.gmbUrl) fd.append("gmbUrl", form.gmbUrl)
      if (form.youtubeUrl) fd.append("youtubeUrl", form.youtubeUrl)
      if (form.logoFile) {
        fd.append("logo", form.logoFile)
      }

      const res = await fetch("/api/business", {
        method: "POST",
        body: fd,
      })

      if (res.ok) {
        setForm({
          businessName: "",
          contactPersonName: "",
          category: "",
          subCategory: "",
          province: "",
          city: "",
          postalCode: "",
          address: "",
          phone: "",
          whatsapp: "",
          email: "",
          description: "",
          logoFile: null,
          websiteUrl: "",
          facebookUrl: "",
          gmbUrl: "",
          youtubeUrl: "",
        })
        toast({ title: "Submitted", description: "Your business has been submitted for review (24–48 hours)." })
        setSubmitted(true)
        onSubmitted?.()
      } else {
        let message = "Please try again."
        try {
          const data = await res.json()
          const details = Array.isArray(data?.details)
            ? data.details
                .map((d: any) => `${d?.path?.join?.('.') || d?.path || ''}: ${d?.message || d?.code || 'invalid'}`)
                .join("; ")
            : ""
          message = [data?.error, details].filter(Boolean).join(" — ") || JSON.stringify(data)
        } catch (_) {
          try {
            message = await res.text()
          } catch {}
        }
        console.error("Submit failed", { status: res.status, message })
        toast({ title: `Submission failed (${res.status})`, description: message, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Network error", description: "Please check your connection.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        
        <Card className="relative bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          {submitting && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent"></div>
              <div className="text-sm text-gray-700 font-medium">Submitting your listing...</div>
            </div>
          )}
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {submitted && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertTitle className="text-green-800">Business submitted</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Thank you! Your business has been submitted and will be reviewed within 24–48 hours.
                  </AlertDescription>
                </Alert>
              )}
              {/* NAP Section - Name, Address, Phone */}
              <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Business Identity</h3>
                    <p className="text-gray-600">Your NAP (Name, Address, Phone) information</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="businessName" className="text-gray-700 font-medium mb-2 block">Business Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input 
                        id="businessName" 
                        placeholder="Enter your business name" 
                        value={form.businessName} 
                        onChange={handleChange} 
                        className="h-12 pl-10 border-gray-300 focus:border-blue-500" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-gray-700 font-medium mb-2 block">Complete Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input 
                        id="address" 
                        placeholder="Street address, building, floor, etc." 
                        value={form.address} 
                        onChange={handleChange} 
                        className="h-12 pl-10 border-gray-300 focus:border-blue-500" 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium mb-2 block">Phone Number <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input 
                        id="phone" 
                        placeholder="+92-XXX-XXXXXXX" 
                        value={form.phone} 
                        onChange={handleChange} 
                        className="h-12 pl-10 border-gray-300 focus:border-blue-500" 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp" className="text-gray-700 font-medium mb-2 block">WhatsApp Number</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input 
                        id="whatsapp" 
                        placeholder="+92-XXX-XXXXXXX" 
                        value={form.whatsapp} 
                        onChange={handleChange} 
                        className="h-12 pl-10 border-gray-300 focus:border-blue-500" 
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Location & Category Section */}
              <section className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Location & Category</h3>
                    <p className="text-gray-600">Where your business is located and what you do</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">Province <span className="text-red-500">*</span></Label>
                    <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" role="combobox" aria-expanded={provinceOpen} className="w-full justify-between h-12 border-gray-300 bg-white">
                          <span className="truncate">{form.province || (provLoading ? "Loading..." : "Select province")}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Search province..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No province found.</CommandEmpty>
                            <CommandGroup>
                              {provinces.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => {
                                    setForm((s) => ({ ...s, province: p.name }));
                                    fetchCitiesByProvince(p.id)
                                    setCityQuery("")
                                    setProvinceOpen(false)
                                  }}
                                >
                                  {p.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-gray-700 font-medium mb-2 block">Postal Code</Label>
                    <div className="relative">
                      <Input
                        id="postalCode"
                        placeholder="e.g. 54000"
                        value={form.postalCode}
                        onChange={handleChange}
                        className="h-12 border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-gray-700 font-medium mb-2 block">City <span className="text-red-500">*</span></Label>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" role="combobox" aria-expanded={cityOpen} className="w-full justify-between h-12 border-gray-300 bg-white">
                          <span className="truncate">{form.city || (cityLoading ? "Loading..." : "Select city")}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Search city..." value={cityQuery} onValueChange={setCityQuery} className="h-9" />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {filteredCities.map((c) => (
                                <CommandItem key={c.id} value={c.name} onSelect={() => { setForm((s) => ({ ...s, city: c.name })); setCityOpen(false); setCityQuery("") }}>
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Category <span className="text-red-500">*</span></Label>
                      <Popover open={catOpen} onOpenChange={setCatOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={catOpen} className="w-full justify-between h-12 border-gray-300 bg-white">
                            <span className="truncate">{form.category ? form.category : "Select a category"}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search category..." value={catQuery} onValueChange={setCatQuery} className="h-9" />
                            <CommandEmpty>
                              {"No categories found."}
                            </CommandEmpty>
                            <CommandList>
                              <CommandGroup heading="Categories">
                                {filteredCategories.map((c) => (
                                  <CommandItem
                                    key={c}
                                    value={c}
                                    onSelect={(val) => {
                                      setForm((p) => ({ ...p, category: val }))
                                      setCatOpen(false)
                                      setCatQuery("")
                                    }}
                                  >
                                    {c}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium mb-2 block">Subcategory</Label>
                      <Popover open={subCatOpen} onOpenChange={setSubCatOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" aria-expanded={subCatOpen} className="w-full justify-between h-12 border-gray-300 bg-white">
                            <span className="truncate">{form.subCategory || (subCatLoading ? "Loading..." : (subCategoryOptions.length ? "Select subcategory" : "No subcategories"))}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search subcategory..." value={subCatQuery} onValueChange={setSubCatQuery} className="h-9" />
                            <CommandEmpty>
                              {"No subcategories found."}
                            </CommandEmpty>
                            <CommandList>
                              <CommandGroup heading={form.category ? `Subcategories of ${form.category}` : "Subcategories"}>
                                {filteredSubCategories.map((s) => (
                                  <CommandItem
                                    key={s}
                                    value={s}
                                    onSelect={(val) => {
                                      setForm((p) => ({ ...p, subCategory: val }))
                                      setSubCatOpen(false)
                                      setSubCatQuery("")
                                    }}
                                  >
                                    {s}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact & Description Section */}
              <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Contact & Description</h3>
                    <p className="text-gray-600">How customers can reach you and what you offer</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contactPersonName" className="text-gray-700 font-medium mb-2 block">Contact Person <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input 
                        id="contactPersonName" 
                        placeholder="Who will answer the phone?" 
                        value={form.contactPersonName} 
                        onChange={handleChange} 
                        className="h-12 pl-10 border-gray-300 focus:border-blue-500" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This is the person customers will speak with.</p>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">Email Address <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="business@example.com" 
                        value={form.email} 
                        onChange={handleChange} 
                        className="h-12 pl-10 border-gray-300 focus:border-blue-500" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-gray-700 font-medium mb-2 block">Business Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your business, services, and what makes you unique..."
                      value={form.description}
                      onChange={handleChange}
                      maxLength={DESCRIPTION_MAX}
                      rows={5}
                      className="border-gray-300 focus:border-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Tips: Add services, specialties, and years of experience.</span>
                      <span>{form.description.length}/{DESCRIPTION_MAX}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="logo" className="text-gray-700 font-medium mb-2 block">Business Logo <span className="text-red-500">*</span></Label>
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="relative flex-1">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-gray-400" />
                        </div>
                        <Input 
                          id="logo" 
                          type="file" 
                          accept="image/png,image/jpeg,image/svg+xml" 
                          onChange={handleFile} 
                          className="h-12 border-gray-300 focus:border-blue-500 opacity-0 z-10" 
                        />
                        <div className="absolute inset-0 flex items-center px-3 pointer-events-none border border-gray-300 rounded-md bg-gray-50">
                          <span className="text-gray-500 ml-8">Upload JPG, PNG, or SVG. Max ~2.5MB.</span>
                        </div>
                      </div>
                      {logoPreview && (
                        <div className="flex-shrink-0">
                          <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-lg border-2 border-dashed border-blue-300 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Optional Digital Presence Section */}
              <section className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Digital Presence (Optional)</h3>
                    <p className="text-gray-600">Enhance your listing with social media and website links</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="websiteUrl" className="text-gray-600 font-medium mb-2 block">Website URL</Label>
                    <Input 
                      id="websiteUrl" 
                      placeholder="https://www.example.com" 
                      value={form.websiteUrl} 
                      onChange={handleChange} 
                      className="h-12 border-gray-300 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebookUrl" className="text-gray-600 font-medium mb-2 block">Facebook Page</Label>
                    <Input 
                      id="facebookUrl" 
                      placeholder="https://facebook.com/yourpage" 
                      value={form.facebookUrl} 
                      onChange={handleChange} 
                      className="h-12 border-gray-300 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="gmbUrl" className="text-gray-600 font-medium mb-2 block">Google Business Profile</Label>
                    <Input 
                      id="gmbUrl" 
                      placeholder="https://maps.google.com/?cid=..." 
                      value={form.gmbUrl} 
                      onChange={handleChange} 
                      className="h-12 border-gray-300 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtubeUrl" className="text-gray-600 font-medium mb-2 block">YouTube Channel</Label>
                    <Input 
                      id="youtubeUrl" 
                      placeholder="https://youtube.com/@yourchannel" 
                      value={form.youtubeUrl} 
                      onChange={handleChange} 
                      className="h-12 border-gray-300 focus:border-indigo-500" 
                    />
                  </div>
                </div>
              </section>

              <div>
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Business Listing"
                  )}
                </Button>
                <p className="text-gray-500 text-center mt-3 text-sm">
                  Your business will be reviewed and published within 24-48 hours
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Default page export so Next.js can render this route
export default function AddBusinessPage() {
  return <AddBusinessForm />
}