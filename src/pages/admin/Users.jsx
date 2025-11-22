import React, { useState, useEffect } from 'react';
import { X, Plus, Send, Ban, Trash2 } from 'lucide-react';
import api from '../../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuspendConfirmation, setShowSuspendConfirmation] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [newInvite, setNewInvite] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToModify, setUserToModify] = useState(null);
  const [roleAction, setRoleAction] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Fetch users and current user on component mount
  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/admin/current-user');
      if (response.data.success) {
        setCurrentUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?page=${page}&limit=${pagination.limit}`);
      console.log(response.data.data.users);
      if (response.data.success) {
        // Update the users state with the response data
        // The API now returns both users and invites with proper serial numbers
        setUsers(response.data.data.users);
        // Update pagination information
        setPagination(prev => ({
          ...prev,
          page: response.data.data.pagination.page,
          total: response.data.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Handle error appropriately, maybe show a message to the user
    } finally {
      setLoading(false);
    }
  };

  // Function to handle creating a new invite via API
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/admin/invites', {
        name: newInvite.name,
        email: newInvite.email
      });
      
      if (response.data.success) {
        // Refresh the user list to include the new invite
        await fetchUsers();
        
        // Reset form and close modal
        setNewInvite({ name: '', email: '' });
        setShowInviteModal(false);
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle resending an invite via API
  const handleResendInvite = async (userId) => {
    setIsSubmitting(true);

    try {
      // Get the user and extract invite ID
      const user = users.find(u => u.id === userId);
      const inviteId = user?.inviteInfo?.id;

      if (!inviteId) {
        console.error('Invite ID not found for user:', userId);
        alert('Unable to resend invite: invite ID not found');
        return;
      }

      // Use invite ID for the API call
      const response = await api.post(`/admin/users/${inviteId}/resend-invite`);

      if (response.data.success) {
        // Refresh the user list to reflect the updated status
        await fetchUsers();
        alert('Invite resent successfully!');
      }
    } catch (error) {
      console.error('Error resending invite:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend invite';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle suspending an invite via API
  const handleSuspendInvite = async (userId) => {
    setIsSubmitting(true);
    
    try {
      const response = await api.post(`/admin/users/${userId}/suspend`);
      
      if (response.data.success) {
        // Refresh the user list to reflect the updated status
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error suspending invite:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle reactivating a suspended user via API
  const handleReactivateUser = async (userId) => {
    setIsSubmitting(true);
    
    try {
      const response = await api.post(`/admin/users/${userId}/reactivate`);
      
      if (response.data.success) {
        // Refresh the user list to reflect the updated status
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
 };

  // Function to handle opening the suspend/delete confirmation dialog
  const openSuspendConfirmation = (userId, action = 'suspend') => {
    const user = users.find(u => u.id === userId);
    setUserToSuspend(user);
    setActionType(action);
    setShowSuspendConfirmation(true);
  };

  // Function to handle confirming the suspension or deletion via API
  const confirmSuspendInvite = async () => {
    if (userToSuspend) {
      setIsSubmitting(true);

      try {
        let response;
        if (actionType === 'delete') {
          response = await api.delete(`/admin/users/${userToSuspend.id}`);
        } else {
          response = await api.post(`/admin/users/${userToSuspend.id}/suspend`);
        }

        if (response.data.success) {
          // Refresh the user list to reflect the updated status
          await fetchUsers();
        }
      } catch (error) {
        console.error(`Error ${actionType}ing user:`, error);
        // Handle error appropriately
      } finally {
        setIsSubmitting(false);
        setShowSuspendConfirmation(false);
        setUserToSuspend(null);
        setActionType(null);
      }
    }
  };

  // Function to handle cancelling the suspension/deletion
  const cancelSuspendInvite = () => {
    setShowSuspendConfirmation(false);
    setUserToSuspend(null);
    setActionType(null);
  };

  // Function to get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-10 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit)) {
      fetchUsers(newPage);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          disabled={isSubmitting}
        >
          <Plus size={18} className="mr-2" />
          Create Invite
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-60"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studio Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invite Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 whitespace-nowrap text-sm text-gray-500 text-center">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-90">{user.sno}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.studioName}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(user.inviteInfo.status)}`}>
                          {user.inviteInfo.status.charAt(0).toUpperCase() + user.inviteInfo.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {user.inviteInfo.status === 'suspended' ? (
                            <button
                              onClick={() => handleReactivateUser(user.id)}
                              disabled={isSubmitting}
                              className="flex items-center px-3 py-1 rounded text-sm bg-green-100 text-green-800 hover:bg-green-20"
                              title="Reactivate User"
                            >
                              <Send size={14} className="mr-1" />
                              Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResendInvite(user.id)}
                              disabled={isSubmitting || user.inviteInfo.status !== 'expired'}
                              className={`flex items-center px-3 py-1 rounded text-sm ${
                                user.inviteInfo.status === 'expired' 
                                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                              title="Resend Invite"
                            >
                              <Send size={14} className="mr-1" />
                              Resend
                            </button>
                          )}
                          <button
                            onClick={() => openSuspendConfirmation(user.id)}
                            disabled={isSubmitting || user.inviteInfo.status === 'suspended'}
                            className={`flex items-center px-3 py-1 rounded text-sm ${
                              user.inviteInfo.status !== 'suspended'
                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                : 'bg-gray-100 text-gray-800 cursor-not-allowed'
                            }`}
                            title="Suspend User"
                          >
                            <Ban size={14} className="mr-1" />
                            Suspend
                          </button>
                          <button
                            onClick={() => openSuspendConfirmation(user.id, 'delete')}
                            disabled={isSubmitting}
                            className="flex items-center px-3 py-1 rounded text-sm bg-red-100 text-red-800 hover:bg-red-200"
                            title="Delete User"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-20 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-30 text-sm font-medium ${
                pagination.page === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className={`relative ml-3 inline-flex items-center px-4 py-2 border border-gray-30 text-sm font-medium ${
                pagination.page === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium ${
                    pagination.page === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  } border-gray-300`}
                >
                  <span className="sr-only">Previous</span>
                  {'<'}
                </button>
                
                {/* Render page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                      pageNum === pagination.page
                        ? 'z-10 bg-indigo-60 text-white border-indigo-60'
                        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300'
                    } border ${
                      pageNum === 1 ? 'rounded-l-md' : ''
                    } ${pageNum === totalPages ? 'rounded-r-md' : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium ${
                    pagination.page === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  } border-gray-300`}
                >
                  <span className="sr-only">Next</span>
                  {'>'}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Invite Creation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Invite</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-60"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newInvite.name}
                    onChange={(e) => setNewInvite({...newInvite, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-50 focus:border-indigo-500"
                    placeholder="Enter user's name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({...newInvite, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-30 rounded-md shadow-sm focus:outline-none focus:ring-indigo-50 focus:border-indigo-500"
                    placeholder="Enter user's email"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">* The invite will be sent over their email. Please enter correct email address</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Suspend/Delete Confirmation Modal */}
      {showSuspendConfirmation && userToSuspend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {actionType === 'delete' ? 'Delete User' : 'Suspend User'}
              </h2>
              <button
                onClick={cancelSuspendInvite}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-6 text-gray-700">
              {actionType === 'delete'
                ? `Are you sure you want to delete this user? This will permanently remove the user account, their studio "${userToSuspend.studioName}", and all associated data. This action cannot be undone.`
                : `Are you sure you want to suspend this user? Their studio "${userToSuspend.studioName}" account will also be suspended.`
              }
            </p>

            {actionType === 'delete' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action is irreversible. Deleted data cannot be recovered.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelSuspendInvite}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              {!actionType && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType('suspend')}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Suspend User
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('delete')}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete User
                  </button>
                </>
              )}
              {actionType && (
                <button
                  type="button"
                  onClick={confirmSuspendInvite}
                  disabled={isSubmitting}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${
                    actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isSubmitting
                    ? (actionType === 'delete' ? 'Deleting...' : 'Suspending...')
                    : (actionType === 'delete' ? 'Yes, Delete User' : 'Yes, Suspend User')
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
