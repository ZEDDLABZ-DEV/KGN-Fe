/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Request } from '../../utils/Request';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  const [roleActionValue, setRoleActionValue] = useState<string | undefined>(undefined);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetForm] = Form.useForm();
  const [resetSaving, setResetSaving] = useState(false);
  const [form] = Form.useForm();
  const { permissions = [] } = useContext(AuthContext) as any;

  const getUsers = async () => {
    if (!permissions.find((p: any) => p.name === 'view_users')) return;
    setLoading(true);
    try {
      const response = await Request.get('/v1/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error('Failed to get users');
    }
  };

  const getRoles = async () => {
    try {
      if (!permissions.find((p: any) => p.name === 'view_users')) return;
      const response = await Request.get('/v1/api/roles-permissions/roles');
      setRoles(response.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to get roles');
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    if (!permissions.find((p: any) => p.name === 'create_users')) return;
    try {
      if (editingUser) {
        await Request.put(`/v1/api/users/${editingUser.id}`, values);
        toast.success('User updated successfully');
      } else {
        await Request.post('/v1/api/auth/signup', values);
        toast.success('User created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingUser(null);
      getUsers();
    } catch (error) {
      console.log(error);
      toast.error(
        editingUser ? 'Failed to update user' : 'Failed to create user'
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!permissions.find((p: any) => p.name === 'delete_users')) return;
      await Request.delete(`/v1/api/users/${id}`);
      toast.success('User deleted successfully');
      getUsers();
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      key: 'role',
      render: (record: any) => (
        <span>{record?.role?.name?.replace(/_/g, ' ')?.toUpperCase()}</span>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) =>
        gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded text-xs ${status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}
        >
          {status?.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record: any) => (
        <div className="flex">
          <Button
            type="link"
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue({
                name: record.name,
                email: record.email,
                phone: record.phone,
                gender: record.gender,
                dateOfBirth: record.dateOfBirth
                  ? dayjs(record.dateOfBirth)
                  : undefined,
                loginWith: record.loginWith,
                roleId: record.roleId,
                status: record.status,
              });
              setIsModalVisible(true);
            }}
          >
            <Tooltip title="Edit User">
              <EditOutlined className="text-lg" />
            </Tooltip>
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            <Tooltip title="Delete User">
              <DeleteOutlined className="text-lg" />
            </Tooltip>
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    getUsers();
    getRoles();
  }, []);

  const handleBulkRoleChange = async (roleId: string) => {
    if (!permissions.find((p: any) => p.name === 'change_role_users')) return;
    if (selectedUserIds.length === 0) {
      toast.error('Select at least one user to change role');
      return;
    }
    setRoleActionLoading(true);
    try {
      await Promise.all(
        selectedUserIds.map((userId) =>
          Request.put(`/v1/api/users/${userId}`, { roleId })
        )
      );
      toast.success('Role updated successfully');
      setRoleActionValue(undefined);
      setSelectedUserIds([]);
      getUsers();
    } catch (error) {
      console.log(error);
      toast.error('Failed to update role');
    } finally {
      setRoleActionLoading(false);
    }
  };

  const openResetModal = (userId: string) => {
    setResetUserId(userId);
    resetForm.resetFields();
    setIsResetModalVisible(true);
  };

  const handleResetPassword = async () => {
    if (!permissions.find((p: any) => p.name === 'reset_password_users')) return;
    try {
      const values = await resetForm.validateFields();
      if (!resetUserId) {
        toast.error('No user selected');
        return;
      }
      setResetSaving(true);
      await Request.post('/v1/api/auth/create-password', {
        password: values.password,
        confirmPassword: values.confirmPassword,
        userId: resetUserId,
      });
      toast.success('Password updated successfully');
      setIsResetModalVisible(false);
      setResetUserId(null);
      resetForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.log(error);
      toast.error('Failed to reset password');
    } finally {
      setResetSaving(false);
    }
  };

  return (
    <ParentLayout title="Users">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            placeholder="Change role"
            size="large"
            className="min-w-[200px]"
            value={roleActionValue}
            onChange={async (value: string) => {
              setRoleActionValue(value);
              await handleBulkRoleChange(value);
            }}
            loading={roleActionLoading}
            allowClear
            onClear={() => setRoleActionValue(undefined)}
            options={roles.map((role: any) => ({
              label: role.name?.replace(/_/g, ' ')?.toUpperCase(),
              value: role.id,
            }))}
          />
          <Button
            size="large"
            disabled={selectedUserIds.length !== 1}
            onClick={() => {
              if (selectedUserIds.length === 1) {
                openResetModal(selectedUserIds[0]);
              } else {
                toast.error('Select exactly one user to reset password');
              }
            }}
          >
            Reset Password
          </Button>
          {selectedUserIds.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedUserIds.length} user
              {selectedUserIds.length > 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {permissions.find((p: any) => p.name === 'create_users') && (
          <Button
            type="primary"
            className="bg-[#4B5563]! hover:bg-gray-400!"
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            <PlusOutlined />
            Create User
          </Button>
        )}
      </div>
      <Table
        loading={loading}
        dataSource={users}
        columns={columns}
        pagination={{ pageSize: 10 }}
        rowKey="id"
        rowSelection={{
          selectedRowKeys: selectedUserIds,
          onChange: (keys) => setSelectedUserIds(keys as string[]),
        }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingUser(null);
        }}
        footer={null}
        width={960}

        styles={{
          body: {
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: 0,
          }
        }}
        style={{ top: 30 }}
      >
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-8 py-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingUser ? 'Update user profile' : 'Add new user'}
            </h2>
            <p className="text-sm text-gray-500">
              Provide personal details, account access, and authentication preferences.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateOrUpdate}
            initialValues={{
              status: 'active',
              loginWith: 'email',
            }}
            className="px-8 py-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter user name' }]}
              >
                <Input size="large" placeholder="Enter user name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input size="large" placeholder="Enter email address" />
              </Form.Item>

              {!editingUser && (
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]}
                >
                  <Input.Password size="large" placeholder="Enter password" />
                </Form.Item>
              )}

              <Form.Item
                label="Phone"
                name="phone"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input size="large" placeholder="Enter phone number" />
              </Form.Item>

              <Form.Item
                label="Gender"
                name="gender"
                rules={[{ required: true, message: 'Please select gender' }]}
              >
                <Select size="large" placeholder="Select gender">
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Date of Birth"
                name="dateOfBirth"
                rules={[{ required: true, message: 'Please select date of birth' }]}
              >
                <DatePicker size="large" className="w-full" format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                label="Role"
                name="roleId"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select size="large" placeholder="Select role">
                  {roles.map((role: any) => (
                    <Select.Option key={role.id} value={role.id}>
                      {role.name?.replace(/_/g, ' ')?.toUpperCase()}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select size="large" placeholder="Select status">
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Login With"
                name="loginWith"
                rules={[{ required: true, message: 'Please select login method' }]}
              >
                <Select size="large" placeholder="Select login method">
                  <Select.Option value="email">Email</Select.Option>
                  <Select.Option value="phone">Phone</Select.Option>
                  <Select.Option value="google">Google</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item className="mb-0 mt-6">
              <div className="flex justify-end gap-3">
                <Button
                  size="large"
                  onClick={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" size="large" htmlType="submit">
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title="Reset Password"
        open={isResetModalVisible}
        onCancel={() => {
          setIsResetModalVisible(false);
          setResetUserId(null);
          resetForm.resetFields();
        }}
        onOk={handleResetPassword}
        confirmLoading={resetSaving}
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Passwords do not match')
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Re-enter password" />
          </Form.Item>
        </Form>
      </Modal>
    </ParentLayout>
  );
};

export { Users };
