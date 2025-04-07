import { Check } from "lucide-react";

export type OrderStep = "select" | "details" | "payment" | "confirm";

interface TimelineItem {
  label: string;
  step: OrderStep;
}

interface OrderTimelineProps {
  currentStep: OrderStep;
  steps: TimelineItem[];
}

export function OrderTimeline({ currentStep, steps }: OrderTimelineProps) {
  const getStepIndex = (step: OrderStep) => {
    return steps.findIndex(s => s.step === step);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={index} className="flex flex-col items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? "bg-primary text-white" 
                  : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className={`text-xs font-medium mt-2 text-center ${
              isCompleted 
                ? "" 
                : "text-gray-600 dark:text-gray-400"
            }`}>
              {step.label}
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 w-full ${
                index < currentIndex 
                  ? "bg-primary" 
                  : "bg-gray-300 dark:bg-gray-700"
              } mx-2 absolute left-0`} 
              style={{
                left: `${((index + 0.5) / (steps.length - 1)) * 100}%`,
                width: `${(1 / (steps.length - 1)) * 100}%`,
                top: '1.25rem' // Adjust based on circle size
              }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Default order steps
export const defaultOrderSteps: TimelineItem[] = [
  { label: "Select Service", step: "select" },
  { label: "Enter Details", step: "details" },
  { label: "Payment", step: "payment" },
  { label: "Confirm", step: "confirm" }
];
