// src/pages/inspection/Preview.js - COMPLETE FIXED VERSION
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Printer, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import { inspectionsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

const Preview = () => {
  const navigate = useNavigate();
  const { id: inspectionId } = useParams();

  const { data: inspection, isLoading, error } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => inspectionsAPI.getById(inspectionId).then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load inspection details</p>
        <button onClick={() => navigate('/inspections')} className="btn btn-primary mt-4">
          Back to Inspections
        </button>
      </div>
    );
  }

  // Helper function to display field value or "Not specified"
  const displayValue = (value, fallback = 'Not specified') => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">{fallback}</span>;
    }
    return value;
  };

  // Helper function to display boolean values
  const displayBoolean = (value) => {
    if (value === true) {
      return <span className="text-green-600 font-medium">Yes</span>;
    } else if (value === false) {
      return <span className="text-gray-500">No</span>;
    }
    return <span className="text-gray-400 italic">Not specified</span>;
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status) {
        case 'completed':
          return { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-800' };
        case 'draft':
          return { icon: Clock, bg: 'bg-yellow-100', text: 'text-yellow-800' };
        case 'reviewed':
          return { icon: CheckCircle, bg: 'bg-blue-100', text: 'text-blue-800' };
        default:
          return { icon: AlertCircle, bg: 'bg-gray-100', text: 'text-gray-800' };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Air Status badge component - NEW
  const AirStatusBadge = ({ status }) => {
    if (status === 'off_air') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          OFF AIR
        </span>
      );
    } else if (status === 'on_air') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          ON AIR
        </span>
      );
    }
    return <span className="text-gray-400 italic">Not specified</span>;
  };

  // Field display component
  const Field = ({ label, value, className = '' }) => (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-600 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{displayValue(value)}</dd>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Preview</h1>
          <p className="text-sm text-gray-600 mt-1">
            Form: <span className="font-medium">{inspection.form_number}</span> • 
            Inspector: <span className="font-medium">{inspection.inspector_name || 'Not assigned'}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <StatusBadge status={inspection.status} />
          <button
            onClick={() => navigate(`/inspection/${inspectionId}/step-4`)}
            className="btn btn-outline"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button className="btn btn-secondary no-print">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button className="btn btn-primary no-print">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-only">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-xl font-bold">COMMUNICATIONS AUTHORITY OF KENYA</h1>
          <h2 className="text-lg">FM & TV Inspection Form</h2>
          <p className="text-sm">{inspection.form_number}</p>
        </div>
      </div>

      {/* Basic Information Summary */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Inspection Summary</h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="Broadcaster" value={inspection.broadcaster_name} />
            <Field label="Inspection Date" value={inspection.inspection_date ? format(new Date(inspection.inspection_date), 'PPP') : null} />
            <Field label="Station Type" value={inspection.station_type} />
            <Field label="Transmitting Site" value={inspection.transmitting_site_name} />
            <Field label="Physical Location" value={inspection.physical_location} />
            <Field label="Status" value={<StatusBadge status={inspection.status} />} />
          </div>
          {inspection.completed_at && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Completed:</strong> {format(new Date(inspection.completed_at), 'PPpp')}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Step 1: Administrative Information & General Data */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-blue-700">Step 1: Administrative Information & General Data</h2>
        </Card.Header>
        <Card.Body>
          {/* ADDED: Program Information Section */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Program Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Program Name" value={inspection.program_name} />
              <Field label="Air Status" value={<AirStatusBadge status={inspection.air_status} />} />
              {inspection.air_status === 'off_air' && (
                <div className="col-span-full">
                  <Field label="Reason for being OFF AIR" value={inspection.off_air_reason} />
                </div>
              )}
            </div>
          </div>

          {/* Broadcaster Details */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Broadcaster Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Name" value={inspection.broadcaster_name} />
              <Field label="P.O. Box" value={inspection.po_box} />
              <Field label="Postal Code" value={inspection.postal_code} />
              <Field label="Town" value={inspection.town} />
              <Field label="Location" value={inspection.location} />
              <Field label="Street" value={inspection.street} />
            </div>
            <div className="mt-4">
              <Field label="Phone Numbers" value={inspection.phone_numbers} />
            </div>
          </div>

          {/* Contact Person */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Contact Person
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Name" value={inspection.contact_name} />
              <Field label="Phone" value={inspection.contact_phone} />
              <Field label="Email" value={inspection.contact_email} />
            </div>
            <div className="mt-4">
              <Field label="Address" value={inspection.contact_address} />
            </div>
          </div>

          {/* General Data */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              General Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Station Type" value={inspection.station_type} />
              <Field label="Transmitting Site Name" value={inspection.transmitting_site_name} />
              <Field label="Longitude" value={inspection.longitude} />
              <Field label="Latitude" value={inspection.latitude} />
              <Field label="Altitude (m above sea level)" value={inspection.altitude} />
              <Field label="Land Owner" value={inspection.land_owner_name} />
            </div>
          </div>

          {/* Physical Address */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Physical Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Location" value={inspection.physical_location} />
              <Field label="Street" value={inspection.physical_street} />
              <Field label="Area" value={inspection.physical_area} />
            </div>
          </div>

          {/* Other Telecoms Operator */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Other Telecoms Operator
            </h3>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Other Telecoms Operator on site?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.other_telecoms_operator)}</dd>
              </div>
              {inspection.other_telecoms_operator && (
                <Field label="Details" value={inspection.telecoms_operator_details} />
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Step 2: Tower Information */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-green-700">Step 2: Tower Information</h2>
        </Card.Header>
        <Card.Body>
          {/* Tower Owner & Specifications */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Tower Owner & Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Tower Owner" value={inspection.tower_owner_name} />
              <Field label="Height Above Ground (m)" value={inspection.height_above_ground} />
              <Field label="Tower Type" value={inspection.tower_type} />
              {inspection.tower_type === 'other' && (
                <Field label="Tower Type (Other)" value={inspection.tower_type_other} />
              )}
              <Field label="Rust Protection" value={inspection.rust_protection} />
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Above Building Roof?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.above_building_roof)}</dd>
              </div>
              {inspection.above_building_roof && (
                <Field label="Building Height (m)" value={inspection.building_height} />
              )}
            </div>
          </div>

          {/* Manufacturer Details */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Manufacturer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Installation Year" value={inspection.installation_year} />
              <Field label="Manufacturer Name" value={inspection.manufacturer_name} />
              <Field label="Model Number" value={inspection.model_number} />
              <Field label="Maximum Wind Load (km/h)" value={inspection.maximum_wind_load} />
              <Field label="Maximum Load Charge (kg)" value={inspection.maximum_load_charge} />
            </div>
          </div>

          {/* Safety & Insurance */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Safety & Insurance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-600">Has Insurance Policy?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_insurance)}</dd>
              </div>
              {inspection.has_insurance && (
                <Field label="Insurance Company" value={inspection.insurance_company} />
              )}
              <div>
                <dt className="text-sm font-medium text-gray-600">Concrete Base?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_concrete_base)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Lightning Protection?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_lightning_protection)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Electrically Grounded?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.is_electrically_grounded)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Aviation Warning Light?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_aviation_warning_light)}</dd>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">Other Antennas on Tower?</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_other_antennas)}</dd>
              </div>
              {inspection.has_other_antennas && (
                <Field label="Other Antennas Details" value={inspection.other_antennas_details} />
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Step 3: Transmitter Information */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-purple-700">Step 3: Transmitter Information</h2>
        </Card.Header>
        <Card.Body>
          {/* Exciter */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              A. EXCITER
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Manufacturer" value={inspection.exciter_manufacturer} />
              <Field label="Model Number" value={inspection.exciter_model_number} />
              <Field label="Serial Number" value={inspection.exciter_serial_number} />
              <Field label="Nominal Power (W)" value={inspection.exciter_nominal_power} />
              <Field label="Actual Reading" value={inspection.exciter_actual_reading} />
            </div>
          </div>

          {/* Amplifier */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              B. AMPLIFIER
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Manufacturer" value={inspection.amplifier_manufacturer} />
              <Field label="Model Number" value={inspection.amplifier_model_number} />
              <Field label="Serial Number" value={inspection.amplifier_serial_number} />
              <Field label="Nominal Power (W)" value={inspection.amplifier_nominal_power} />
              <Field label="Actual Reading" value={inspection.amplifier_actual_reading} />
              <Field label="RF Output Connector Type" value={inspection.rf_output_connector_type} />
              <Field label="Frequency Range" value={inspection.frequency_range} />
              <Field label="Transmit Frequency" value={inspection.transmit_frequency} />
              <Field label="Frequency Stability (ppm)" value={inspection.frequency_stability} />
              <Field label="Harmonics Suppression Level (dB)" value={inspection.harmonics_suppression_level} />
              <Field label="Spurious Emission Level (dB)" value={inspection.spurious_emission_level} />
              <Field label="Transmit Bandwidth (-26dB)" value={inspection.transmit_bandwidth} />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-600">Internal Audio Limiter</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_internal_audio_limiter)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Internal Stereo Coder</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_internal_stereo_coder)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Transmitter Catalog Attached</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.transmitter_catalog_attached)}</dd>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              FILTER
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Filter Type" value={inspection.filter_type} />
              <Field label="Manufacturer" value={inspection.filter_manufacturer} />
              <Field label="Model Number" value={inspection.filter_model_number} />
              <Field label="Serial Number" value={inspection.filter_serial_number} />
              <Field label="Frequency" value={inspection.filter_frequency} />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Step 4: Antenna System & Final Information */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-orange-700">Step 4: Antenna System & Final Information</h2>
        </Card.Header>
        <Card.Body>
          {/* Antenna System */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              ANTENNA SYSTEM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Height on Tower/Mast (m)" value={inspection.height_on_tower} />
              <Field label="Antenna Type" value={inspection.antenna_type} />
              {/* FIXED: Use correct field names from model */}
              <Field label="Antenna Manufacturer" value={inspection.antenna_manufacturer} />
              <Field label="Antenna Model Number" value={inspection.antenna_model_number} />
              <Field label="Polarization" value={inspection.polarization} />
              <Field label="Horizontal Pattern" value={inspection.horizontal_pattern} />
              <Field label="Beam Width (-3dB)" value={inspection.beam_width_3db} />
              <Field label="Max Gain Azimuth" value={inspection.max_gain_azimuth} />
              <Field label="Antenna Gain" value={inspection.antenna_gain} />
            </div>
            
            {/* Pattern Tables */}
            <div className="mt-6 space-y-4">
              {inspection.horizontal_pattern_table && (
                <Field label="Horizontal Pattern Table" value={inspection.horizontal_pattern_table} />
              )}
              {inspection.vertical_pattern_table && (
                <Field label="Vertical Pattern Table" value={inspection.vertical_pattern_table} />
              )}
            </div>

            {/* Tilt and Null Fill */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Mechanical Tilt?</dt>
                  <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_mechanical_tilt)}</dd>
                </div>
                {inspection.has_mechanical_tilt && (
                  <Field label="Mechanical Tilt Degree" value={inspection.mechanical_tilt_degree} />
                )}
              </div>
              
              <div className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Electrical Tilt?</dt>
                  <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_electrical_tilt)}</dd>
                </div>
                {inspection.has_electrical_tilt && (
                  <Field label="Electrical Tilt Degree" value={inspection.electrical_tilt_degree} />
                )}
              </div>
              
              <div className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Null Fill?</dt>
                  <dd className="text-sm text-gray-900">{displayBoolean(inspection.has_null_fill)}</dd>
                </div>
                {inspection.has_null_fill && (
                  <Field label="Null Fill Percentage" value={inspection.null_fill_percentage} />
                )}
              </div>
            </div>

            {/* System Performance */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">System Performance</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Estimated Antenna Losses (dB)" value={inspection.estimated_antenna_losses} />
                <Field label="Estimated Feeder Losses (dB)" value={inspection.estimated_feeder_losses} />
                <Field label="Estimated Multiplexer Losses (dB)" value={inspection.estimated_multiplexer_losses} />
                <Field label="Effective Radiated Power (kW)" value={inspection.effective_radiated_power} />
              </div>
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-600">Antenna Catalog Attached</dt>
                <dd className="text-sm text-gray-900">{displayBoolean(inspection.antenna_catalog_attached)}</dd>
              </div>
            </div>
          </div>

          {/* Studio to Transmitter Link */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              STUDIO TO TRANSMITTER LINK
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Manufacturer" value={inspection.studio_manufacturer} />
              <Field label="Model Number" value={inspection.studio_model_number} />
              <Field label="Serial Number" value={inspection.studio_serial_number} />
              <Field label="Frequency (MHz)" value={inspection.studio_frequency} />
              <Field label="Polarization" value={inspection.studio_polarization} />
            </div>
            <div className="mt-4">
              <Field label="Signal Description" value={inspection.signal_description} />
            </div>
          </div>

          {/* Final Information */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              OTHER INFORMATION
            </h3>
            <div className="space-y-4">
              <Field label="Technical Personnel (Maintenance)" value={inspection.technical_personnel} />
              <Field label="Other Observations" value={inspection.other_observations} />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between no-print">
        <button
          onClick={() => navigate('/inspections')}
          className="btn btn-outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inspections
        </button>

        {inspection.status === 'completed' && (
          <button
            onClick={() => navigate('/inspection/new/step-1')}
            className="btn btn-primary"
          >
            Create New Inspection
          </button>
        )}
      </div>
    </div>
  );
};

export default Preview;