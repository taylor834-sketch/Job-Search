import { useState } from 'react';
import Select from 'react-select';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { searchJobs } from '../services/api';
import './SearchForm.css';

const locationOptions = [
  { value: 'remote', label: 'Remote Only' },
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

// Common US cities by state for autocomplete
const usCities = {
  'oregon': ['Portland', 'Eugene', 'Salem', 'Bend', 'Corvallis'],
  'washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
  'california': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
  'texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  'new york': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
  'florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
  'illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford'],
  'pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
  'ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron'],
  'georgia': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
  'north carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
  'michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'],
  'arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
  'massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
  'tennessee': ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
  'indiana': ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  'missouri': ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
  'maryland': ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf'],
  'wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  'minnesota': ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington'],
  'colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
  'alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
  'south carolina': ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill'],
  'louisiana': ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
  'kentucky': ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
  'utah': ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
  'nevada': ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
};

function SearchForm({ onResults, onLoading, onError }) {
  const [jobTitle, setJobTitle] = useState('');
  const [locationTypes, setLocationTypes] = useState([]);
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [companySizes, setCompanySizes] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [salaryRange, setSalaryRange] = useState([30000, 200000]);
  const [datePosted, setDatePosted] = useState('all');

  // Check if location input should be shown
  const showLocationInput = locationTypes.some(
    type => type.value === 'onsite' || type.value === 'hybrid'
  );

  // Handle location input change with autocomplete
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length >= 2) {
      // Extract potential state from input
      const lowerValue = value.toLowerCase();
      const suggestions = [];

      // Check each state for matching cities
      Object.entries(usCities).forEach(([state, cities]) => {
        if (lowerValue.includes(state.substring(0, 3))) {
          cities.forEach(city => {
            if (city.toLowerCase().includes(lowerValue.split(',')[0].trim().toLowerCase())) {
              suggestions.push(`${city}, ${state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`);
            }
          });
        }
      });

      // Also search all cities if no state mentioned
      if (suggestions.length === 0) {
        Object.entries(usCities).forEach(([state, cities]) => {
          cities.forEach(city => {
            if (city.toLowerCase().startsWith(lowerValue.toLowerCase())) {
              suggestions.push(`${city}, ${state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`);
            }
          });
        });
      }

      setLocationSuggestions(suggestions.slice(0, 5));
    } else {
      setLocationSuggestions([]);
    }
  };

  // Select all company sizes
  const selectAllCompanySizes = () => {
    setCompanySizes(companySizeOptions);
  };

  // Select all industries
  const selectAllIndustries = () => {
    setIndustries(industryOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError(null);

    if (!jobTitle.trim()) {
      onError('Please enter a job title');
      return;
    }

    if (showLocationInput && !location.trim()) {
      onError('Please enter a location for onsite/hybrid jobs');
      return;
    }

    onLoading(true);

    try {
      const searchParams = {
        jobTitle: jobTitle.trim(),
        locationType: locationTypes.map(opt => opt.value),
        location: showLocationInput ? location.trim() : undefined,
        companySizes: companySizes.map(opt => opt.value),
        industries: industries.map(opt => opt.value),
        minSalary: salaryRange[0],
        maxSalary: salaryRange[1],
        datePosted: datePosted
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

        {showLocationInput && (
          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="location">City, State *</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={handleLocationChange}
              placeholder="e.g., Portland, Oregon"
              className="text-input"
            />
            {locationSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {locationSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setLocation(suggestion);
                      setLocationSuggestions([]);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: idx < locationSuggestions.length - 1 ? '1px solid #eee' : 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Company Size</label>
            <button
              type="button"
              onClick={selectAllCompanySizes}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline'
              }}
            >
              Select All
            </button>
          </div>
          <Select
            isMulti
            options={companySizeOptions}
            value={companySizes}
            onChange={setCompanySizes}
            placeholder="Select company sizes..."
            className="select-input"
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Industry</label>
            <button
              type="button"
              onClick={selectAllIndustries}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline'
              }}
            >
              Select All
            </button>
          </div>
          <Select
            isMulti
            options={industryOptions}
            value={industries}
            onChange={setIndustries}
            placeholder="Select industries..."
            className="select-input"
          />
        </div>
      </div>

      <div className="form-group">
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

      <div className="form-group">
        <label htmlFor="datePosted">Date Posted</label>
        <select
          id="datePosted"
          value={datePosted}
          onChange={(e) => setDatePosted(e.target.value)}
          className="text-input"
        >
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="3days">Last 3 Days</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      <button type="submit" className="submit-button">
        Search Jobs
      </button>
    </form>
  );
}

export default SearchForm;
