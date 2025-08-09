
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Download, 
  FileText, 
  FileText as FileTextIcon,
  FileSpreadsheet, 
  TableIcon,
  Loader2
} from "lucide-react";

interface ReportGenerationProps {
  modelParams: any;
  results: any;
  timestamp?: string;
}

const ReportGeneration = ({ 
  modelParams, 
  results, 
  timestamp = new Date().toISOString() 
}: ReportGenerationProps) => {
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  
  const handleGeneratePDF = () => {
    try {
      // In a real application, this would generate and download a PDF
      setIsGeneratingPDF(true);
      
      // Simulate processing time
      setTimeout(() => {
        setIsGeneratingPDF(false);
        toast({
          title: "PDF Report Generated",
          description: "Emergency response report has been created and downloaded.",
        });
      }, 1500);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsGeneratingPDF(false);
      toast({
        title: "PDF Generation Failed",
        description: "An error occurred while generating the PDF report.",
        variant: "destructive"
      });
    }
  };
  
  const handleGenerateExcel = () => {
    try {
      // In a real application, this would generate and download an Excel file
      setIsGeneratingExcel(true);
      
      // Simulate processing time
      setTimeout(() => {
        setIsGeneratingExcel(false);
        toast({
          title: "Excel Data Generated",
          description: "Simulation data has been exported to Excel format.",
        });
      }, 1200);
    } catch (error) {
      console.error("Error generating Excel:", error);
      setIsGeneratingExcel(false);
      toast({
        title: "Excel Generation Failed",
        description: "An error occurred while generating the Excel data.",
        variant: "destructive"
      });
    }
  };
  
  const handleGenerateCSV = () => {
    try {
      // In a real application, this would generate and download a CSV file
      setIsGeneratingCSV(true);
      
      // Simulate processing time
      setTimeout(() => {
        setIsGeneratingCSV(false);
        toast({
          title: "CSV Data Generated",
          description: "Raw data has been exported to CSV format.",
        });
      }, 800);
    } catch (error) {
      console.error("Error generating CSV:", error);
      setIsGeneratingCSV(false);
      toast({
        title: "CSV Generation Failed",
        description: "An error occurred while generating the CSV data.",
        variant: "destructive"
      });
    }
  };

  // Validate that we have required data before allowing report generation
  const validateReportData = () => {
    // Check if we have modelParams and results
    if (!modelParams || !results) {
      return false;
    }
    
    // Check for essential model parameters
    if (!modelParams.chemicalType || modelParams.releaseRate === undefined) {
      return false;
    }
    
    // Check for essential results
    if (!results.redZone || !results.yellowZone || !results.orangeZone) {
      return false;
    }
    
    return true;
  };
  
  const isDataValid = validateReportData();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDataValid && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <p className="text-amber-800 text-sm">
              Complete model calculation first to enable report generation.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-3 border border-dashed">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <FileTextIcon className="h-5 w-5 text-red-500" />
                <span className="font-medium">Full PDF Report</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 flex-1">
                Complete emergency response report with maps, charts, and recommendations.
              </div>
              <Button 
                className="w-full" 
                onClick={handleGeneratePDF}
                variant="outline"
                size="sm"
                disabled={isGeneratingPDF || !isDataValid}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            </div>
          </Card>
          
          <Card className="p-3 border border-dashed">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                <span className="font-medium">Excel Workbook</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 flex-1">
                Detailed data tables for further analysis in Excel format.
              </div>
              <Button 
                className="w-full" 
                onClick={handleGenerateExcel}
                variant="outline"
                size="sm"
                disabled={isGeneratingExcel || !isDataValid}
              >
                {isGeneratingExcel ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </>
                )}
              </Button>
            </div>
          </Card>
          
          <Card className="p-3 border border-dashed">
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <TableIcon className="h-5 w-5 text-blue-500" />
                <span className="font-medium">CSV Raw Data</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 flex-1">
                Plain text CSV format for universal compatibility.
              </div>
              <Button 
                className="w-full" 
                onClick={handleGenerateCSV}
                variant="outline"
                size="sm"
                disabled={isGeneratingCSV || !isDataValid}
              >
                {isGeneratingCSV ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
        
        <Separator />
        
        <div className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Report ID:</span>
            <span className="font-mono">ELDQM-{timestamp.substring(0, 10).replace(/-/g, '')}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Chemical:</span>
            <span>{modelParams.chemicalType || 'Not specified'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Release Rate:</span>
            <span>{modelParams.releaseRate ? `${modelParams.releaseRate} kg/min` : 'Not specified'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Time Generated:</span>
            <span>{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGeneration;
