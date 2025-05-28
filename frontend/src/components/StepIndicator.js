// src/components/StepIndicator.js
import React from 'react';
import { Check } from 'lucide-react';

const StepIndicator = ({ steps, currentStep, className = '' }) => {
  return (
    <nav className={`step-indicator ${className}`} aria-label="Progress">
      <ol className="flex items-center space-x-2 sm:space-x-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <li 
              key={step.id} 
              className={`step-item flex items-center ${
                isActive ? 'step-active' : 
                isCompleted ? 'step-completed' : 
                'step-inactive'
              }`}
            >
              <div className="step-number flex-shrink-0">
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{stepNumber}</span>
                )}
              </div>
              <span className="hidden sm:inline ml-2 text-sm font-medium">
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="hidden sm:block w-8 h-0.5 bg-gray-300 ml-4" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;