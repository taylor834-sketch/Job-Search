import { useState } from 'react';
import Select from 'react-select';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { searchJobs } from '../services/api';
import './SearchForm.css';

const locationOptions = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'hybrid', label: 'Hybrid' }
];

const companySizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' }
];

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'other', label: 'Other' }
];

function SearchForm({ onResults, onLoading, onError }) {
  const [jobTitle, setJobTitle] = useState('');
  const [locationTypes, setLocationTypes] = useState([]);
  const [companySizes, setCompanySizes] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [salaryRange, setSalaryRange] = useState([30000, 200000]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError(null);

    if (!jobTitle.trim()) {
      onError('Please enter a job title');
      return;
    }

    onLoading(true);

    try {
      const searchParams = {
        jobTitle: jobTitle.trim(),
        locationType: locationTypes.map(opt => opt.value),
        companySizes: companySizes.map(opt => opt.value),
        industries: industries.map(opt => opt.value),
        minSalary: salaryRange[0],
        maxSalary: salaryRange[1]
      };

      const results = await searchJobs(searchParams);
      onResults(results.jobs || [], searchParams);

      if (results.jobs.length === 0) {
        onError('No jobs found. Try adjusting your search criteria.');
      }
    } catch (error) {
      onError(error.message || 'Failed to search for jobs. Please try again.');
    } finally {
      onLoading(false);
    }
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="jobTitle">Job Title *</label>
        <input
          id="jobTitle"
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g., Software Engineer, Product Manager"
          className="text-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Location Type</label>
          <Select
            isMulti
            options={locationOptions}
            value={locationTypes}
            onChange={setLocationTypes}
            placeholder="Select location types..."
            className="select-input"
          />
        </div>

        <div className="form-group">
          <label>Company Size</label>
          <Select
            isMulti
            options={companySizeOptions}
            value={companySizes}
            onChange={setCompanySizes}
            placeholder="Select company sizes..."
            className="select-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Industry</label>
        <Select
          isMulti
          options={industryOptions}
          value={industries}
          onChange={setIndustries}
          placeholder="Select industries..."
          className="select-input"
        />
        <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
          Powered by JSearch API - searches Google Jobs, LinkedIn & Indeed
        </small>
      </div>

      <div className="form-group">
        <label>
          Salary Range: ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
        </label>
        <div className="slider-container">
          <Slider
            range
            min={0}
            max={300000}
            step={5000}
            value={salaryRange}
            onChange={setSalaryRange}
            trackStyle={[{ backgroundColor: '#667eea' }]}
            handleStyle={[
              { borderColor: '#667eea', backgroundColor: '#667eea' },
              { borderColor: '#667eea', backgroundColor: '#667eea' }
            ]}
          />
        </div>
      </div>

      <button type="submit" className="submit-button">
        Search Jobs
      </button>
    </form>
  );
}

export default SearchForm;
