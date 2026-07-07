import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import * as roleService from '../../services/roleService';
import '../../styles/pages/PermissionMatrix.css';

const LOCKED_ROLE_NAME = 'Super Administrator';

function PermissionMatrix() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [original, setOriginal] = useState({});
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [roleRows, permissionCatalog] = await Promise.all([
        roleService.listRoles(),
        roleService.listPermissionCatalog(),
      ]);

      const perRole = await Promise.all(
        roleRows.map((role) => roleService.getRolePermissionIds(role.id)),
      );

      const assignmentMap = {};
      roleRows.forEach((role, index) => {
        assignmentMap[role.id] = new Set(perRole[index]);
      });

      setRoles(roleRows);
      setCatalog(permissionCatalog);
      setOriginal(assignmentMap);
      setAssignments(assignmentMap);
      setLoading(false);
    }

    load();
  }, []);

  const toggle = (roleId, permissionId) => {
    setAssignments((prev) => {
      const next = { ...prev, [roleId]: new Set(prev[roleId]) };
      if (next[roleId].has(permissionId)) {
        next[roleId].delete(permissionId);
      } else {
        next[roleId].add(permissionId);
      }
      return next;
    });
  };

  const hasChanges = roles.some((role) => {
    const before = original[role.id];
    const after = assignments[role.id];
    if (!before || !after || before.size !== after.size) return true;
    for (const id of before) if (!after.has(id)) return true;
    return false;
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const changedRoles = roles.filter((role) => {
        const before = original[role.id];
        const after = assignments[role.id];
        if (before.size !== after.size) return true;
        for (const id of before) if (!after.has(id)) return true;
        return false;
      });

      for (const role of changedRoles) {
        // Sequential, not parallel — keeps activity log ordering sane and
        // avoids hammering the DB with N simultaneous transactions.
        await roleService.setRolePermissions(role.id, Array.from(assignments[role.id]));
      }

      setOriginal(assignments);
      setMessage('Permissions saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/roles')}>
            <FiArrowLeft aria-hidden="true" /> Back to Roles
          </button>
          <h1 className="page-title">Permission Matrix</h1>
          <p className="page-subtitle">Assign what each role can view, create, edit, delete or approve</p>
        </div>
        <div className="page-actions">
          <button type="button" className={`btn btn-primary ${saving ? 'btn-loading' : ''}`} disabled={!hasChanges || saving} onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success mb-4" role="status">{message}</div>}
      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <div className="card">
        <div className="table-wrapper">
          <table className="table permission-matrix-table">
            <thead>
              <tr>
                <th>Permission</th>
                {roles.map((role) => (
                  <th key={role.id} className="text-center">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(catalog).map(([module, permissions]) => (
                <Fragment key={module}>
                  <tr className="permission-matrix-module-row">
                    <td colSpan={roles.length + 1}>{module}</td>
                  </tr>
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td>
                        <span className="text-sm">{permission.action}</span>
                        {permission.description && <div className="form-help">{permission.description}</div>}
                      </td>
                      {roles.map((role) => {
                        const locked = role.name === LOCKED_ROLE_NAME;
                        const checked = locked || assignments[role.id]?.has(permission.id);
                        return (
                          <td key={role.id} className="text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={locked}
                              onChange={() => toggle(role.id, permission.id)}
                              aria-label={`${permission.code} for ${role.name}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PermissionMatrix;
