/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useState } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import { Form, Input, Button, Card } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Request } from '../../utils/Request';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, permissions = [] } = useContext(AuthContext) as any;
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Check if user is admin - check for admin-level permissions
  const isAdmin = permissions.some((p: any) => 
    ['manage_users', 'manage_roles', 'admin'].includes(p.name)
  );

  const handlePasswordChange = async (values: any) => {
    if (!isAdmin) {
      toast.error('Only administrators can change passwords');
      return;
    }

    setLoading(true);
    try {
      await Request.put('/v1/api/auth/change-admin-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParentLayout title="Settings">
      <div className="flex flex-col gap-6">
        {/* User Info Card */}
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <UserOutlined className="text-2xl text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.name || user?.email || 'User'}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {user?.role && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                  {user.role.name || user.role}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Password Change Card - Admin Only */}
        {isAdmin ? (
          <Card 
            title={
              <div className="flex items-center gap-2">
                <LockOutlined className="text-gray-600" />
                <span className="text-lg font-semibold">Change Password</span>
              </div>
            }
            className="rounded-xl border border-gray-200 shadow-sm"
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
              autoComplete="off"
            >
              <Form.Item
                label="Current Password"
                name="currentPassword"
                rules={[
                  { required: true, message: 'Please enter your current password' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Enter current password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="New Password"
                name="newPassword"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Enter new password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Confirm New Password"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Confirm new password"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  className="bg-black hover:bg-gray-800"
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <div className="text-center py-8">
              <LockOutlined className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">
                Password change is only available for administrators.
              </p>
            </div>
          </Card>
        )}
      </div>
    </ParentLayout>
  );
};

export { Settings };
