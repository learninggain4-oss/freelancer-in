import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Code, Palette, PenTool, BarChart3, Camera, Music, Globe, Megaphone, FileText, Wrench, GraduationCap, Heart, Headphones, ShoppingCart, Cpu, BookOpen, Smartphone, TrendingUp, Layers, Search, Printer, Database, Shield, Monitor, Mic, MapPin, Scissors, Truck, Landmark, Stethoscope, Scale, Leaf, Gamepad2, Plane, Baby, Dog, Gem, Bike, Utensils, Lightbulb, Briefcase, Users, X } from "lucide-react";

const categories = [
  { icon: Code, label: "Web Development", count: "450+" },
  { icon: Palette, label: "Graphic Design", count: "380+" },
  { icon: PenTool, label: "Content Writing", count: "320+" },
  { icon: BarChart3, label: "Digital Marketing", count: "290+" },
  { icon: Smartphone, label: "App Development", count: "260+" },
  { icon: Layers, label: "UI/UX Design", count: "230+" },
  { icon: Camera, label: "Video & Animation", count: "210+" },
  { icon: Megaphone, label: "Social Media", count: "200+" },
  { icon: Search, label: "SEO Services", count: "190+" },
  { icon: Globe, label: "Translation", count: "180+" },
  { icon: ShoppingCart, label: "E-commerce", count: "170+" },
  { icon: FileText, label: "Data Entry", count: "160+" },
  { icon: Music, label: "Music & Audio", count: "150+" },
  { icon: Headphones, label: "Customer Support", count: "140+" },
  { icon: Wrench, label: "IT & Networking", count: "130+" },
  { icon: GraduationCap, label: "Online Tutoring", count: "120+" },
  { icon: Heart, label: "Lifestyle & Wellness", count: "110+" },
  { icon: BookOpen, label: "Academic Writing", count: "100+" },
  { icon: Cpu, label: "AI & Machine Learning", count: "90+" },
  { icon: TrendingUp, label: "Business Consulting", count: "85+" },
  { icon: Printer, label: "Print Design", count: "80+" },
  { icon: Database, label: "Database Management", count: "75+" },
  { icon: Shield, label: "Cybersecurity", count: "70+" },
  { icon: Monitor, label: "Desktop Apps", count: "65+" },
  { icon: Mic, label: "Voiceover & Narration", count: "60+" },
  { icon: MapPin, label: "Local Services", count: "55+" },
  { icon: Scissors, label: "Fashion & Tailoring", count: "50+" },
  { icon: Truck, label: "Logistics & Delivery", count: "48+" },
  { icon: Landmark, label: "Finance & Accounting", count: "95+" },
  { icon: Stethoscope, label: "Healthcare Writing", count: "45+" },
  { icon: Scale, label: "Legal Services", count: "40+" },
  { icon: Leaf, label: "Environmental Services", count: "35+" },
  { icon: Gamepad2, label: "Game Development", count: "55+" },
  { icon: Plane, label: "Travel & Hospitality", count: "42+" },
  { icon: Baby, label: "Childcare Services", count: "30+" },
  { icon: Dog, label: "Pet Services", count: "25+" },
  { icon: Gem, label: "Jewelry & Crafts", count: "28+" },
  { icon: Bike, label: "Sports & Fitness", count: "38+" },
  { icon: Utensils, label: "Food & Recipe Writing", count: "33+" },
  { icon: Lightbulb, label: "Innovation Consulting", count: "22+" },
];

const Categories = () => {
  const [search, setSearch] = useState("");
  const filtered = categories.filter((cat) =>
    cat.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-xl">All Categories</h1>
            <p className="text-xs text-muted-foreground">{categories.length} categories • 2,700+ services</p>
          </div>
        </div>
      </header>

      {/* Search & Grid */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No categories match "{search}"</p>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((cat) => (
            <Card key={cat.label} className="group border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <cat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} services</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-xl border bg-muted/30 p-6 sm:p-8 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Can't find what you're looking for?</p>
          <p className="text-sm text-muted-foreground mb-6">Join our platform and get started today</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register/employee">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <Briefcase className="h-4 w-4" />
                Join as Employee
              </Button>
            </Link>
            <Link to="/register/client">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Users className="h-4 w-4" />
                Post a Custom Job
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Categories;
