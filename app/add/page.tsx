"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle, ArrowLeft } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { categories, cities } from "@/lib/mock-data"

interface FormDataShape {
  name: string
  contactPerson?: string
  category: string
  city: string
  address: string
  phone: string
  whatsapp: string
  email: string
  description: string
}

export default function AddBusinessPage() {
  const [formData, setFormData] = useState<FormDataShape>({
    name: "",
    contactPerson: "",
    category: "",
    city: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    description: "",
  })

  // Shared field styling: light-black placeholder, clear borders, visible focus
  const fieldClass = "placeholder:text-gray-600 bg-white border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/20"

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<FormDataShape>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string>("")
  const [submitError, setSubmitError] = useState<string>("")

  const handleInputChange = (field: keyof FormDataShape, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormDataShape> = {}
    let logoErrorMsg = ""

    if (!formData.name.trim()) newErrors.name = "Business name is required"
    if (!formData.category) newErrors.category = "Category is required"
    if (!formData.city) newErrors.city = "City is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.description.trim()) newErrors.description = "Description is required"
    
    // Logo validation - now required
    if (!logoFile) logoErrorMsg = "Business logo is required"

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    setLogoError(logoErrorMsg)
    return Object.keys(newErrors).length === 0 && !logoErrorMsg
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const fd = new FormData()
      fd.append("name", formData.name)
      if (formData.contactPerson !== undefined) fd.append("contactPerson", formData.contactPerson || "")
      fd.append("category", formData.category)
      fd.append("city", formData.city)
      fd.append("address", formData.address)
      fd.append("phone", formData.phone)
      fd.append("whatsapp", formData.whatsapp)
      fd.append("email", formData.email)
      fd.append("description", formData.description)
      if (logoFile) fd.append("logo", logoFile)

      const res = await fetch("/api/business", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        console.error("API Error:", data)
        console.error("Validation details:", data?.details)
        if (data?.details && Array.isArray(data.details)) {
          data.details.forEach((detail: any, index: number) => {
            console.error(`Validation Error ${index + 1}:`, detail)
          })
        }
        console.error("Received data:", data?.receivedData)
        throw new Error(data?.error || "Failed to submit business")
      }
      setIsSubmitted(true)
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      console.error("Submit error:", err)
      setSubmitError(err?.message || "Unexpected error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Business Submitted Successfully!</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Thank you for adding your business to Cition. Your listing has been submitted and will be reviewed by our
              team. You should see it live on the directory within 24-48 hours.
            </p>
            <div className="space-y-3">
              <Button asChild size="lg">
                <Link href="/">Back to Home</Link>
              </Button>
              <br />
              <Button variant="outline" asChild>
                <Link href="/add">Add Another Business</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Add Your Business</h1>
            <p className="text-muted-foreground">
              Join thousands of businesses on Pakistan's leading directory. It's free and takes just a few minutes.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                {/* Business Name */}
                <div>
                  <Label htmlFor="name">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Al-Noor Auto Workshop"
                    className={`${errors.name ? "border-destructive" : ""} ${fieldClass}`}
                  />
                  {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                </div>

                {/* Contact Person (optional) */}
                <div>
                  <Label htmlFor="contactPerson">Contact person name</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson || ""}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    placeholder="e.g., Muhammad Ali"
                    className={fieldClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional. Who should we contact for this listing?</p>
                </div>

                {/* Category and City Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className={`${errors.category ? "border-destructive" : ""} ${fieldClass}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.slug} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                      <SelectTrigger className={`${errors.city ? "border-destructive" : ""} ${fieldClass}`}>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.slug} value={city.slug}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street, area, city (complete address)"
                    className={`${errors.address ? "border-destructive" : ""} ${fieldClass}`}
                  />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                </div>

                {/* Phone and WhatsApp Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+92-XXX-XXXXXXX"
                      className={`${errors.phone ? "border-destructive" : ""} ${fieldClass}`}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp (Optional)</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                      placeholder="+92-XXX-XXXXXXX"
                      className={`${fieldClass}`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="e.g., info@yourbusiness.com"
                    className={`${errors.email ? "border-destructive" : ""} ${fieldClass}`}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">
                    Business Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your services, specialties, timings, branches, and what makes you unique..."
                    rows={4}
                    className={`${errors.description ? "border-destructive" : ""} ${fieldClass}`}
                  />
                  {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
                </div>

                {/* Logo Upload */}
                <div>
                  <Label htmlFor="logo">
                    Business Logo <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setLogoFile(file)
                        if (file && logoError) {
                          setLogoError("")
                        }
                      }}
                      className={`${logoError ? "border-destructive" : ""} ${fieldClass}`}
                    />
                    {logoFile ? (
                      <p className="text-xs text-muted-foreground mt-1">Selected: {logoFile.name}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Please upload your business logo (JPG, PNG, or SVG)</p>
                    )}
                  </div>
                  {logoError && <p className="text-sm text-destructive mt-1">{logoError}</p>}
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertDescription>
                    Your business listing will be reviewed by our team and published within 24-48 hours. All listings
                    are free of charge.
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Business Listing"}
                </Button>
                {submitError && (
                  <p className="text-sm text-destructive text-center">{submitError}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
