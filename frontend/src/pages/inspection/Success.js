// src/pages/inspection/Success.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Plus, ArrowRight } from 'lucide-react';
import { useFormStore } from '../../store';

const Success = () => {
  const navigate = useNavigate();
  const { resetForm } = useFormStore();

  useEffect(() => {
    // Reset form data when reaching success page
    resetForm();
  }, [resetForm]);

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="animate-fade-in">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Inspection Completed Successfully!
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Your FM & TV inspection form has been completed and saved. The form is now ready for review and processing.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-800 space-y-2 text-left">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
              Your inspection data has been saved securely
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
              You can access and edit this inspection anytime
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
              Generate reports and export data as needed
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/inspections')}
            className="btn btn-outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            View All Inspections
          </button>
          
          <button
            onClick={() => navigate('/inspection/new/step-1')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Inspection
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;