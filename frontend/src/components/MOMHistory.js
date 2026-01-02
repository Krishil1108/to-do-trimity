import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const MOMHistory = () => {
  const [tasksWithMoms, setTasksWithMoms] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [momHistory, setMomHistory] = useState([]);
  const [selectedMom, setSelectedMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchTasksWithMoms();
  }, []);

  const fetchTasksWithMoms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mom/tasks-with-moms`);
      setTasksWithMoms(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks with MOMs');
    } finally {
      setLoading(false);
    }
  };

  const fetchMomHistory = async (taskId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/mom/history/${taskId}`);
      setMomHistory(response.data.data.moms || []);
      setSelectedTask(response.data.data.task);
      setError(null);
    } catch (err) {
      console.error('Error fetching MOM history:', err);
      setError('Failed to load MOM history');
    } finally {
      setLoading(false);
    }
  };

  const viewMomDetails = async (momId) => {
    try {
      const response = await axios.get(`${API_URL}/mom/view/${momId}`);
      setSelectedMom(response.data.data);
    } catch (err) {
      console.error('Error fetching MOM details:', err);
      alert('Failed to load MOM details');
    }
  };

  const downloadMomWord = async (momId) => {
    try {
      const endpoint = `${API_URL}/mom/regenerate-docx-from-template/${momId}`;
      
      const response = await axios.post(
        endpoint,
        {},
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MOM_${momId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccessMessage('Word document downloaded successfully with your letterhead!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error downloading Word document:', err);
      setErrorMessage('Failed to download Word document: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const deleteMom = async (momId) => {
    if (!window.confirm('Are you sure you want to delete this MOM?')) return;

    try {
      await axios.delete(`${API_URL}/mom/${momId}`);
      setSuccessMessage('MOM deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (selectedTask) {
        fetchMomHistory(selectedTask._id);
      }
      fetchTasksWithMoms();
    } catch (err) {
      console.error('Error deleting MOM:', err);
      setErrorMessage('Failed to delete MOM');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && tasksWithMoms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading MOMs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Success Message Box */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message Box */}
        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MOM History</h1>
          <p className="text-gray-600 mt-2">View and manage all Minutes of Meeting records</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Tasks with MOMs ({tasksWithMoms.length})</h2>
            
            {tasksWithMoms.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No MOMs created yet</p>
            ) : (
              <div className="space-y-2">
                {tasksWithMoms.map((task) => (
                  <button
                    key={task.taskId}
                    onClick={() => fetchMomHistory(task.taskId)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTask?._id === task.taskId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{task.taskTitle}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">{task.momCount} MOM{task.momCount > 1 ? 's' : ''}</span>
                      <span className="text-xs text-gray-400">{formatDate(task.lastMomDate)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MOM History List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            {!selectedTask ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Select a task to view MOM history</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
                    <p className="text-gray-600 text-sm">{momHistory.length} MOM records</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setMomHistory([]);
                      setSelectedMom(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {momHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No MOMs found for this task</p>
                ) : (
                  <div className="space-y-4">
                    {momHistory.map((mom) => (
                      <div
                        key={mom._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{mom.title}</h3>
                            <div className="mt-2 space-y-1 text-sm text-gray-600">
                              <p><strong>Visit Date:</strong> {mom.visitDate}</p>
                              <p><strong>Location:</strong> {mom.location}</p>
                              <p><strong>Attendees:</strong> {mom.attendees.map(a => a.name).join(', ')}</p>
                              <p><strong>Created:</strong> {formatDate(mom.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => viewMomDetails(mom._id)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              View
                            </button>
                            <button
                              onClick={() => downloadMomWord(mom._id)}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                            >
                              Word
                            </button>
                            <button
                              onClick={() => deleteMom(mom._id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* MOM Detail Modal */}
        {selectedMom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">MOM Details</h2>
                <button
                  onClick={() => setSelectedMom(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Title:</h3>
                  <p>{selectedMom.title}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Visit Date:</h3>
                  <p>{selectedMom.visitDate}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Location:</h3>
                  <p>{selectedMom.location}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Attendees:</h3>
                  <ul className="list-disc list-inside">
                    {selectedMom.attendees.map((attendee, index) => (
                      <li key={index}>{attendee.name}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Raw Content:</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                    {selectedMom.rawContent}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Processed Content:</h3>
                  <div className="bg-blue-50 p-4 rounded border border-blue-200 whitespace-pre-wrap">
                    {selectedMom.processedContent}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => downloadMomWord(selectedMom._id)}
                    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Download Word
                  </button>
                  <button
                    onClick={() => setSelectedMom(null)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MOMHistory;
