import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-md px-4">
        <div className="border-2 border-border bg-card p-12 relative text-center">
          <div className="absolute top-0 left-0 w-2 h-2 bg-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary" />
          
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <AlertCircle className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="font-heading text-6xl font-black uppercase tracking-tighter text-foreground mb-2">
            404
          </h1>
          <p className="font-mono text-sm text-muted-foreground mb-8 uppercase tracking-widest">
            Page Not Found
          </p>
          
          <Link href="/">
            <Button className="w-full font-mono uppercase tracking-wider border-2 border-primary bg-primary text-primary-foreground py-6 btn-click-anim btn-glow">
              <Home className="w-4 h-4 mr-2" />
              Return to Base
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
