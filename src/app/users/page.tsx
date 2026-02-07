'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      
      if (data.user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(data.user);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, getAuthHeaders]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser, loadUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Update user
        const updateData: Partial<typeof formData> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        const res = await fetch(`/api/users/${editingUser._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to update user');
        }

        setSuccess('User updated successfully');
      } else {
        // Create user
        if (!formData.password) {
          setError('Password is required for new users');
          return;
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to create user');
        }

        setSuccess('User created successfully');
      }

      closeModal();
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (user: User) => {
    if (user._id === currentUser?.id) {
      alert('Cannot delete your own account');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setSuccess('User deleted successfully');
        loadUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete user');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth_token');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>👥 User Management</h1>
            <p className={styles.subtitle}>Create and manage user accounts</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.userInfo}>
              👤 {currentUser?.name} ({currentUser?.role})
            </span>
            <Link href="/dashboard" className={styles.navLink}>
              📍 Dashboard
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className={`status success`} style={{ marginBottom: '20px' }}>
          ✓ {success}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <button className="btn" onClick={openCreateModal}>
            ➕ Add New User
          </button>
        </div>

        <div className={styles.usersTable}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <strong>{user.name}</strong>
                    {user._id === currentUser?.id && (
                      <span className={styles.youTag}>You</span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.roleTag} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={styles.editBtn}
                      onClick={() => openEditModal(user)}
                    >
                      ✏️
                    </button>
                    {user._id !== currentUser?.id && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(user)}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className={styles.emptyState}>
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            
            {error && (
              <div className={`status error`} style={{ marginBottom: '15px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  minLength={6}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'user',
                    })
                  }
                  className={styles.input}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
