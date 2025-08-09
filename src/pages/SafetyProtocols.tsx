
import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, AlertCircle, AlertTriangle } from 'lucide-react';

const SafetyProtocols = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Safety Protocols</h1>
          
          <Tabs defaultValue="emergency">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="emergency">Emergency Response</TabsTrigger>
              <TabsTrigger value="prevention">Prevention Measures</TabsTrigger>
              <TabsTrigger value="procedures">Standard Procedures</TabsTrigger>
            </TabsList>
            
            <TabsContent value="emergency">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {emergencyProtocols.map((protocol, index) => (
                  <ProtocolCard key={index} protocol={protocol} variant="emergency" />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="prevention">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {preventionProtocols.map((protocol, index) => (
                  <ProtocolCard key={index} protocol={protocol} variant="prevention" />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="procedures">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {standardProtocols.map((protocol, index) => (
                  <ProtocolCard key={index} protocol={protocol} variant="standard" />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

interface Protocol {
  title: string;
  description: string;
  steps: string[];
}

interface ProtocolCardProps {
  protocol: Protocol;
  variant: 'emergency' | 'prevention' | 'standard';
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, variant }) => {
  const getIcon = () => {
    switch (variant) {
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'prevention':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'standard':
        return <Check className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        {getIcon()}
        <CardTitle>{protocol.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">{protocol.description}</CardDescription>
        <ol className="list-decimal pl-5 space-y-2">
          {protocol.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

// Sample data
const emergencyProtocols: Protocol[] = [
  {
    title: "Chemical Leak Response",
    description: "Critical procedures to follow when a chemical leak is detected",
    steps: [
      "Activate emergency alarms and notification systems",
      "Evacuate personnel from affected areas following designated routes",
      "Seal off contaminated areas to prevent spread",
      "Deploy emergency response team with appropriate PPE",
      "Initiate containment procedures based on chemical type"
    ]
  },
  {
    title: "Fire Emergency Protocol",
    description: "Steps to follow during fire incidents involving chemicals",
    steps: [
      "Activate fire alarm and alert facility personnel",
      "Use appropriate fire suppression systems based on chemical type",
      "Evacuate to designated assembly points",
      "Account for all personnel and report missing individuals",
      "Provide first responders with chemical inventory information"
    ]
  },
  {
    title: "Medical Emergency Response",
    description: "Procedures for handling chemical exposure incidents",
    steps: [
      "Remove affected personnel from exposure area if safe to do so",
      "Locate and review Safety Data Sheet (SDS) for exposed chemical",
      "Administer first aid according to exposure type",
      "Contact emergency medical services with chemical exposure details",
      "Arrange decontamination if required before medical transport"
    ]
  },
  {
    title: "Evacuation Protocol",
    description: "Organized facility evacuation procedures during chemical incidents",
    steps: [
      "Sound evacuation alarm using designated signal",
      "Follow evacuation routes marked on facility maps",
      "Proceed to designated assembly areas upwind of the incident",
      "Perform headcount using department checklists",
      "Remain at assembly area until all-clear is given"
    ]
  }
];

const preventionProtocols: Protocol[] = [
  {
    title: "Regular Equipment Inspection",
    description: "Preventative maintenance schedule for safety equipment",
    steps: [
      "Conduct weekly visual inspections of all chemical containment systems",
      "Perform monthly pressure tests on storage vessels",
      "Test emergency shower and eyewash stations weekly",
      "Calibrate gas detection systems quarterly",
      "Document all inspections in maintenance log"
    ]
  },
  {
    title: "Staff Training Requirements",
    description: "Ongoing training program for chemical handling personnel",
    steps: [
      "Complete initial hazardous materials handling certification",
      "Attend quarterly refresher training sessions",
      "Participate in monthly emergency drills",
      "Complete annual respiratory protection training",
      "Maintain current first aid and CPR certification"
    ]
  },
  {
    title: "Storage Compatibility Guidelines",
    description: "Proper chemical storage practices to prevent reactions",
    steps: [
      "Separate oxidizers from flammable and combustible materials",
      "Store acids and bases in separate cabinets",
      "Keep water-reactive chemicals in dry, waterproof containers",
      "Store peroxide-forming chemicals with date received and expiration date",
      "Maintain inventory control system with regular audits"
    ]
  },
  {
    title: "Ventilation System Maintenance",
    description: "Maintaining proper air handling for chemical areas",
    steps: [
      "Inspect ventilation hoods monthly for proper airflow",
      "Clean ductwork and fans quarterly",
      "Replace filters according to manufacturer specifications",
      "Perform smoke tests to verify containment annually",
      "Document all maintenance activities and airflow measurements"
    ]
  }
];

const standardProtocols: Protocol[] = [
  {
    title: "Chemical Handling Procedure",
    description: "Standard operating procedures for routine chemical handling",
    steps: [
      "Review Safety Data Sheet before handling any chemical",
      "Wear appropriate personal protective equipment",
      "Use mechanical aids for moving large containers",
      "Work in well-ventilated areas or under fume hoods",
      "Clean work area and dispose of waste properly after use"
    ]
  },
  {
    title: "Waste Disposal Protocol",
    description: "Proper procedures for chemical waste management",
    steps: [
      "Segregate waste by compatibility groups",
      "Label all waste containers with contents and hazard information",
      "Store waste in designated collection areas",
      "Complete waste log for each container",
      "Arrange pickup through environmental services"
    ]
  },
  {
    title: "Laboratory Closing Procedure",
    description: "End-of-day safety checklist for laboratory areas",
    steps: [
      "Return all chemicals to appropriate storage locations",
      "Secure caps and lids on all containers",
      "Turn off non-essential equipment",
      "Check that all gas valves are closed",
      "Ensure all waste is properly contained and labeled"
    ]
  },
  {
    title: "Spill Management Procedure",
    description: "Steps for managing minor chemical spills",
    steps: [
      "Assess the spill size and hazard level",
      "Notify area supervisor of the spill",
      "Don appropriate PPE before approaching the spill",
      "Contain the spill using appropriate spill kits",
      "Document the incident and disposal of cleanup materials"
    ]
  }
];

export default SafetyProtocols;
