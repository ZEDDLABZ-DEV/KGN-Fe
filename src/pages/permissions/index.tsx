/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Checkbox,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Request } from '../../utils/Request';
import { toast } from 'react-hot-toast';

const Permissions = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(
    false
  );
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>();
  const [selectedPermissions, setSelectedPermissions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [permissionsForm] = Form.useForm();

  const getRoles = async () => {
    setLoading(true);
    try {
      const response = await Request.get('/v1/api/roles-permissions/roles');
      setRoles(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error('Failed to get roles');
    }
  };

  const getPermissions = async () => {
    try {
      const response = await Request.get(
        '/v1/api/roles-permissions/permissions'
      );
      setPermissions(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateOrUpdatePermissions = async () => {
    try {
      console.log(selectedPermissions, 'values');
      await Request.post(`/v1/api/roles-permissions/roles/assign-permissions`, {
        permissionIds: selectedPermissions,
        roleId: selectedRole?.id,
      });
      toast.success('Permissions created successfully');
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      if (editingRole) {
        await Request.put(`/v1/api/roles/${editingRole.id}`, values);
        toast.success('Role updated successfully');
      } else {
        await Request.post('/v1/api/roles-permissions/roles', values);
        toast.success('Role created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingRole(null);
      getRoles();
    } catch (error) {
      console.log(error);
      toast.error(
        editingRole ? 'Failed to update role' : 'Failed to create role'
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Request.delete(`/v1/api/roles-permissions/roles/${id}`);
      toast.success('Role deleted successfully');
      getRoles();
    } catch (error) {
      console.log(error);
      toast.error((error as any).response.data.message || 'Failed to delete role');
    }
  };

  const openPermissionsModal = (role: any) => {
    setSelectedRole(role);
    const permissionIds =
      role?.permissions?.map(
        (permission: any) => permission?.permission?.id ?? permission?.id
      ) ?? [];
    setSelectedPermissions(permissionIds);
    permissionsForm.setFieldsValue({ permissionIds });
    setIsPermissionsModalVisible(true);
  };

  const columns = [
    {
      title: 'Role Name',
      render: (record: any) => (
        <div className="flex flex-wrap gap-3 text-xs">
          {record?.name?.replace(/_/g, ' ')?.toUpperCase()}
        </div>
      ),
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      key: 'permissions',
      width: 400,
      render: (record: any) => (
        <div className="flex flex-wrap gap-3">
          {record?.permissions?.length > 0 ? record?.permissions?.map((permission: any) => (
            <Tag key={permission?.permission?.id} color="blue">
              {permission?.permission?.name?.replace(/_/g, ' ')?.toUpperCase()}
            </Tag>
          ))
            : <Tag color="orange">No permissions assigned</Tag>}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (record: any) => (
        <div className="flex w-[100px]">
          <Button
            type="link"
            onClick={() => openPermissionsModal(record)}
          >
            <Tooltip title="Edit Permissions">
              {' '}
              <LockOutlined className=" text-lg" />
            </Tooltip>
          </Button>
          <Button
            type="link"
            onClick={() => openPermissionsModal(record)}
          >
            <Tooltip title="Edit Role">
              <EditOutlined className="text-lg" />
            </Tooltip>
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            <Tooltip title="Delete Role">
              <DeleteOutlined className="text-lg" />
            </Tooltip>
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    getRoles();
    getPermissions();
  }, []);

  useEffect(() => {
    permissionsForm.setFieldsValue({ permissionIds: selectedPermissions });
  }, [selectedPermissions, permissionsForm]);

  return (
    <ParentLayout title="Roles & Permissions">
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          className="bg-[#4B5563]! hover:bg-gray-400!"
          onClick={() => {
            setEditingRole(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          <PlusOutlined />
          Create Role
        </Button>
      </div>
      <Table
        loading={loading}
        dataSource={roles}
        columns={columns}
        pagination={false}
        rowKey="id"
      />

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingRole(null);
        }}
        footer={null}
        width={640}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px 28px 16px',
          }
        }}
        style={{ top: 40 }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <Form.Item
            label="Role Name"
            name="name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea placeholder="Enter role description" rows={3} />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingRole(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRole ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Edit Permissions for ${selectedRole?.name
          ?.replace(/_/g, ' ')
          ?.toUpperCase()}`}
        open={isPermissionsModalVisible}
        onCancel={() => {
          setIsPermissionsModalVisible(false);
          setSelectedPermissions([]);
        }}
        footer={null}
        width={1240}
        styles={{
          body: {
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: '24px 28px 16px',
          }
        }}
        style={{ top: 40 }}
      >
        <Form
          form={permissionsForm}
          layout="vertical"
          onFinish={handleCreateOrUpdatePermissions}
        >
          <Form.Item
            label="Permissions"
            name="permissionIds"
            rules={[{ required: true, message: 'Please select permissions' }]}
          >
            <div className="flex w-full flex-wrap">
              {permissions.map((permission: any) => {
                const isSelected = selectedPermissions.includes(permission?.id);
                return (
                  <div key={permission?.id} className="flex w-1/2 flex-col p-4">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition-all ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                      onClick={() =>
                        setSelectedPermissions((prev) =>
                          prev.includes(permission?.id)
                            ? prev.filter((id: any) => id !== permission?.id)
                            : [...prev, permission?.id]
                        )
                      }
                    >
                      <Checkbox
                        value={permission?.id}
                        checked={isSelected}
                        className="pointer-events-none"
                      >
                        {permission?.name?.replace(/_/g, ' ')?.toUpperCase()}
                      </Checkbox>
                    </button>
                  </div>
                );
              })}
            </div>
          </Form.Item>
          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsPermissionsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Permissions
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </ParentLayout>
  );
};

export { Permissions };
