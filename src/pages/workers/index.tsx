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
  Select,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Request } from '../../utils/Request';
import { toast } from 'react-hot-toast';

const Workers = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [form] = Form.useForm();

  const getWorkers = async () => {
    setLoading(true);
    try {
      const response = await Request.get('/v1/api/users/list/labours');
      setWorkers(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error('Failed to get workers');
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      if (editingWorker) {
        await Request.put(`/v1/api/users/labour/${editingWorker.id}`, values);
        toast.success('Worker updated successfully');
      } else {
        await Request.post('/v1/api/users/labour', values);
        toast.success('Worker created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingWorker(null);
      getWorkers();
    } catch (error) {
      console.log(error);
      toast.error(
        editingWorker ? 'Failed to update worker' : 'Failed to create worker'
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Request.delete(`/v1/api/workers/${id}`);
      toast.success('Worker deleted successfully');
      getWorkers();
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete worker');
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
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Skills',
      dataIndex: 'skills',
      width: 280,
      key: 'skills',
      render: (skills: string[]) => (
        <div className="flex flex-wrap gap-1">
          {skills?.map((skill: string, index: number) => (
            <Tag key={index} color="blue">
              {skill}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Experience',
      dataIndex: 'experience',
      key: 'experience',
      render: (experience: any) => experience ? `${experience} years` : '-',
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: any) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status?.toUpperCase()}
        </Tag>
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
              setEditingWorker(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          >
            <Tooltip title="Edit Worker">
              <EditOutlined className="text-lg" />
            </Tooltip>
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            <Tooltip title="Delete Worker">
              <DeleteOutlined className="text-lg" />
            </Tooltip>
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    getWorkers();
  }, []);

  return (
    <ParentLayout title="Workers">
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          className="bg-[#4B5563]! hover:bg-gray-400!"
          onClick={() => {
            setEditingWorker(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          <PlusOutlined />
          Add Worker
        </Button>
      </div>
      <Table
        loading={loading}
        dataSource={workers}
        columns={columns}
        pagination={false}
        rowKey="id"
      />

      <Modal
        title={editingWorker ? 'Edit Worker' : 'Add Worker'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingWorker(null);
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
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter worker name' }]}
          >
            <Input placeholder="Enter worker name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            label="Skills"
            name="skills"
            rules={[{ required: true, message: 'Please select skills' }]}
          >
            <Select
              mode="tags"
              placeholder="Enter or select skills"
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item
            label="Experience (years)"
            name="experience"
            rules={[{ required: true, message: 'Please enter years of experience' }]}
          >
            <Input type="number" placeholder="Enter years of experience" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingWorker(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingWorker ? 'Update' : 'Create'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </ParentLayout>
  );
};

export { Workers };
