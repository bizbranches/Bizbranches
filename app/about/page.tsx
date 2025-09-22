"use client"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">About us</h1>

        <p className="text-muted-foreground text-lg mb-6">
          Join us in building a vibrant business community!
        </p>

        <p className="text-foreground/90 leading-relaxed mb-4">
          BizBranches.pk is your ultimate online destination for finding businesses and their branches across Pakistan. Our mission is to simplify the process of locating businesses by providing a comprehensive and user-friendly platform.
        </p>
        <p className="text-foreground/90 leading-relaxed mb-4">
          We believe that every business deserves to be discovered, and our directory is designed to connect businesses with potential customers efficiently. Whether you’re searching for a local store, a professional service, or a large corporation, BizBranches.pk has got you covered.
        </p>
        <p className="text-foreground/90 leading-relaxed mb-8">
          Our vision is to become the most trusted and comprehensive business directory in Pakistan, empowering both businesses and consumers alike. We strive to create a platform that is not only informative but also inspiring, helping businesses grow and succeed.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Our Vision</h2>
          <p className="text-foreground/90 leading-relaxed">
            To be the leading online platform in Pakistan that connects businesses with their target audience through a comprehensive and user-friendly business directory.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Our Mission</h2>
          <p className="text-foreground/90 leading-relaxed">
            To provide a platform that enables businesses to enhance their visibility and reach a wider customer base, while offering users a convenient way to discover and explore businesses across Pakistan.
          </p>
        </section>

        <blockquote className="border-l-4 border-primary pl-4 md:pl-5 py-2 italic text-foreground/90 mb-8">
          Find and connect with every Pakistani business, from bustling city centers to hidden local gems
        </blockquote>

        <div className="mt-10">
          <p className="text-foreground font-semibold">Digital Skills House</p>
          <p className="text-muted-foreground">Founder of BizBranches.pk</p>

          <hr className="my-6 border-primary border-2"  />

          <h1 className="text-xl md:text-xl font-semibold text-foreground">DEVELOPED BY:</h1>
          <p className="text-muted-foreground">Taoqeer Ahmad Rajput</p>

          
        </div>
      </div>
    </main>
  )
}
