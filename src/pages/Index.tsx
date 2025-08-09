
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, AlertTriangle, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const handleDemo = () => {
    toast({
      title: "Welcome to HazardCloud",
      description: "This is a demo of the application. Explore the features!",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-20">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                <span className="text-primary">Emergency Leakage and Dispersion Quantification Model</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Advanced industrial safety monitoring system for chemical leak detection and dispersion modeling. Real-time alerts and safety protocols for emergency response.
              </p>
              <div className="flex gap-4">
                <Button size="lg" asChild>
                  <Link to="/emergency-model">
                    Launch Application <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={handleDemo}>
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="container px-4 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Complete safety solution for industrial chemical handling
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border border-border/50 hover:border-primary/50 transition-colors hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 p-2 bg-primary/10 rounded-lg w-10 h-10 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Industrial Safety?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Our ELDQM system provides real-time monitoring, advanced dispersion calculations, and comprehensive safety protocols.
              </p>
              <div className="flex gap-4">
                <Button size="lg" asChild>
                  <Link to="/emergency-model">Get Started Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/safety-protocols">View Safety Protocols</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Sample features data
const features = [
  {
    icon: <AlertTriangle className="text-primary" />,
    title: "Leak Detection",
    description: "Real-time monitoring and automatic alert systems for chemical leakage detection."
  },
  {
    icon: <MapPin className="text-primary" />,
    title: "Dispersion Modeling",
    description: "Advanced calculations to predict the spread of hazardous chemicals based on environmental conditions."
  },
  {
    icon: <Shield className="text-primary" />,
    title: "Safety Protocols",
    description: "Comprehensive emergency response procedures and safety guidelines for different hazard levels."
  }
];

export default Index;
