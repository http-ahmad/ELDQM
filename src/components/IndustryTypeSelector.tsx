
import React from 'react';
import { Factory, AlertOctagon, Leaf, Beaker, FlaskConical, Building, Building2, Warehouse, Droplet, MapPin, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IndustryTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface IndustryOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  hazardLevel: 'high' | 'medium' | 'low';
  typicalChemicals: string[];
}

const industries: IndustryOption[] = [
  {
    id: 'chemical',
    label: 'Chemical',
    icon: FlaskConical,
    description: 'General chemical processing and manufacturing',
    hazardLevel: 'high',
    typicalChemicals: ['Chlorine', 'Ammonia', 'Sulfuric Acid']
  },
  {
    id: 'petrochemical',
    label: 'Petrochemical',
    icon: Flame,
    description: 'Oil refineries and petroleum-based chemicals',
    hazardLevel: 'high',
    typicalChemicals: ['Benzene', 'Hydrogen Sulfide', 'Methane']
  },
  {
    id: 'pharmaceutical',
    label: 'Pharmaceutical',
    icon: Beaker,
    description: 'Drug manufacturing and medical chemicals',
    hazardLevel: 'medium',
    typicalChemicals: ['Ethylene Oxide', 'Methanol', 'Acetone']
  },
  {
    id: 'agricultural',
    label: 'Agricultural',
    icon: Leaf,
    description: 'Fertilizers and agricultural chemicals',
    hazardLevel: 'medium',
    typicalChemicals: ['Ammonia', 'Phosphoric Acid', 'Pesticides']
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    description: 'General manufacturing facilities',
    hazardLevel: 'medium',
    typicalChemicals: ['Toluene', 'Acetone', 'Formaldehyde']
  },
  {
    id: 'industrial',
    label: 'Industrial',
    icon: Building,
    description: 'Heavy industrial complexes and plants',
    hazardLevel: 'high',
    typicalChemicals: ['Sulfur Dioxide', 'Lead', 'Mercury']
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: Warehouse,
    description: 'Chemical storage and warehousing',
    hazardLevel: 'medium',
    typicalChemicals: ['Various Chemicals', 'Flammable Liquids', 'Oxidizers']
  },
  {
    id: 'hazardous',
    label: 'Hazardous',
    icon: AlertOctagon,
    description: 'High-risk hazardous materials',
    hazardLevel: 'high',
    typicalChemicals: ['Hydrogen Cyanide', 'Phosgene', 'Radioactive Materials']
  },
  {
    id: 'water_treatment',
    label: 'Water Treatment',
    icon: Droplet,
    description: 'Water and wastewater treatment facilities',
    hazardLevel: 'medium',
    typicalChemicals: ['Chlorine', 'Sodium Hypochlorite', 'Sulfur Dioxide']
  },
  {
    id: 'natural_gas',
    label: 'Natural Gas',
    icon: Flame,
    description: 'Natural gas processing and distribution',
    hazardLevel: 'high',
    typicalChemicals: ['Methane', 'Ethane', 'Hydrogen Sulfide']
  }
];

export const IndustryTypeSelector = ({ value, onChange }: IndustryTypeSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Industry Type</CardTitle>
        <CardDescription>
          Select the industry classification for accurate dispersion modeling
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <RadioGroup 
            value={value} 
            onValueChange={onChange}
            className="grid grid-cols-2 sm:grid-cols-5 gap-4"
          >
            {industries.map((industry) => {
              const Icon = industry.icon;
              const isActive = value === industry.id;
              
              // Determine background color based on hazard level
              let hazardColorClass = "";
              let hazardTextClass = "";
              if (isActive) {
                switch(industry.hazardLevel) {
                  case 'high':
                    hazardColorClass = "bg-red-50";
                    hazardTextClass = "text-red-700";
                    break;
                  case 'medium':
                    hazardColorClass = "bg-amber-50";
                    hazardTextClass = "text-amber-700";
                    break;
                  case 'low':
                    hazardColorClass = "bg-blue-50";
                    hazardTextClass = "text-blue-700";
                    break;
                }
              }
              
              return (
                <div
                  key={industry.id}
                  className={`
                    relative flex flex-col items-center rounded-lg border-2 p-4 cursor-pointer transition-all
                    ${isActive 
                      ? `border-primary ${hazardColorClass} shadow-md` 
                      : 'border-muted bg-background hover:border-primary/30 hover:bg-primary/5'
                    }
                  `}
                  onClick={() => onChange(industry.id)}
                >
                  <RadioGroupItem 
                    value={industry.id} 
                    id={industry.id} 
                    className="sr-only"
                  />
                  <Icon className={`h-8 w-8 mb-3 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label 
                    htmlFor={industry.id} 
                    className={`font-medium text-center ${isActive ? hazardTextClass : 'text-muted-foreground'}`}
                  >
                    {industry.label}
                  </Label>
                  <p className="text-xs text-center text-muted-foreground mt-2 line-clamp-2 h-10">
                    {industry.description}
                  </p>
                  
                  {/* Hazard indicator */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: industry.hazardLevel === 'high' ? '#ef4444' : 
                                      industry.hazardLevel === 'medium' ? '#f59e0b' : '#3b82f6' 
                      }}
                    >
                      <span className="text-white text-[10px] font-bold">
                        {industry.hazardLevel === 'high' ? 'H' : 
                        industry.hazardLevel === 'medium' ? 'M' : 'L'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </RadioGroup>
        </ScrollArea>
        
        {/* Display information about selected industry */}
        {industries.filter(ind => ind.id === value).map(selectedIndustry => (
          <div key={selectedIndustry.id} className="mt-6 p-4 rounded-lg bg-slate-50 border">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{selectedIndustry.label} Industry Profile</h3>
            </div>
            
            <div className="mt-2">
              <p className="mb-3">{selectedIndustry.description}</p>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Hazard Level:</span>
                <span className={`text-sm rounded-full px-3 py-1 ${
                  selectedIndustry.hazardLevel === 'high' ? 'bg-red-100 text-red-800' : 
                  selectedIndustry.hazardLevel === 'medium' ? 'bg-amber-100 text-amber-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedIndustry.hazardLevel.charAt(0).toUpperCase() + selectedIndustry.hazardLevel.slice(1)}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Common Chemicals:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedIndustry.typicalChemicals.map((chemical, idx) => (
                    <span key={idx} className="bg-slate-200 text-slate-700 rounded px-3 py-1">
                      {chemical}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
