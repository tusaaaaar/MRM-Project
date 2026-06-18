import axios from 'axios'

// const API_BASE_URL = 'http://127.0.0.1:8000'
const API_BASE_URL = 'http://192.168.1.6:8000'
const UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`
const DATA_QUALITY_ENDPOINT = `${API_BASE_URL}/data-quality`
/**
 * Upload a credit-risk dataset and run backend analysis.
 *
 * @param {File} file - CSV or XLSX file selected by the user.
 * @param {number} predictionThreshold - Threshold for binary classification.
 * @param {number} goodThreshold - Upper PD bound for Good segment.
 * @param {number} badThreshold - Lower PD bound for Bad segment.
 * @returns {Promise<object>} API response containing validation, metrics, and segments.
 */
export async function uploadDataset(
  file,
  predictionThreshold,
  goodThreshold,
  badThreshold
) {
  if (!(file instanceof File)) {
    throw new Error('A valid file must be provided for upload.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('prediction_threshold', predictionThreshold)
  formData.append('good_threshold', goodThreshold)
  formData.append('bad_threshold', badThreshold)

  try {
    const response = await axios.post(UPLOAD_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(', ')
        : typeof detail === 'string'
          ? detail
          : error.message
      throw new Error(message || 'Failed to upload dataset.')
    }
    throw new Error('An unexpected error occurred while uploading the dataset.')
  }
}
/**
 * Upload a dataset and run data quality assessment only.
 * Does not execute model pipeline or predictions.
 *
 * @param {File} file - CSV or XLSX file selected by the user.
 * @returns {Promise<object>} API response containing data_quality_report, issue_log, recommendations.
 */
export async function uploadDataQuality(file) {
  if (!(file instanceof File)) {
    throw new Error('A valid file must be provided for upload.')
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(DATA_QUALITY_ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg ?? JSON.stringify(item)).join(', ')
        : typeof detail === 'string'
          ? detail
          : error.message
      throw new Error(message || 'Failed to run data quality assessment.')
    }
    throw new Error('An unexpected error occurred during data quality assessment.')
  }
}

export async function downloadExecutivePDF(resultData) {
  const response = await fetch('http://localhost:8000/export-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resultData),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  // Convert the response to a file (blob) and trigger browser download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Executive_Audit_Report.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function sendChatMessage(messages, contextSummary) {
  const response = await fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      messages: messages, 
      context_summary: contextSummary 
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to Auditor Copilot');
  }

  return await response.json();
}