/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import { Button, Input, Form, Modal, Table, Select, Tooltip } from 'antd';
import { Request } from '../../utils/Request';
import { toast } from 'react-hot-toast';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';

const Teams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const { permissions = [] } = useContext(AuthContext) as any;
  const [form] = Form.useForm();

  const getTeams = async () => {
    try {
      setLoading(true);
      if(!permissions.find((p: any) => p.name === 'view_teams')) return;
      const response = await Request.get('/v1/api/teams/all');
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error('Failed to get teams');
    }
  };

  const getTeamLeaders = async () => {
    try {
      if(!permissions.find((p: any) => p.name === 'view_teams')) return;
      const response = await Request.get('/v1/api/users');
      setTeamLeaders(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getLabours = async () => {
    try {
      if(!permissions.find((p: any) => p.name === 'view_teams')) return;
      const response = await Request.get('/v1/api/users/list/labours');
      setLabours(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Team Leader',
      key: 'teamLeader',
      render: (item: any) => item?.lead?.name || 'N/A',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <Tooltip title={description}>
          <span className="truncate max-w-[200px] block">
            {description?.length > 50
              ? `${description.substring(0, 50)}...`
              : description}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Total Members',
      render: (item: any) => item?._count?.TeamPeoples || 0,
      key: 'members',
    },
    {
      title: 'Created At',
      render: (item: any) =>
        moment(item?.createdAt).format('MMM, D Y') || 'N/A',
      key: 'createdAt',
    },
  ];

  useEffect(() => {
    getTeams();
    getLabours();
    getTeamLeaders();
  }, []);

  const handleCreateTeam = async (values: any) => {
    try {
      setLoading(true);
      const response = await Request.post('/v1/api/teams', values);
      setTeams([...teams, response.data]);
      setIsModalOpen(false);
      toast.success('Team created successfully');
    } catch (error) {
      console.log(error);
      toast.error('Failed to create team');
    }
    setLoading(false);
  };

  return (
    <ParentLayout title="Teams">
        {permissions.find((p: any) => p.name === 'create_teams') && (
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          size="large"
          className="justify-end mb-4 bg-[#4B5563]! hover:bg-gray-400!"
          icon={<PlusOutlined className="text-white" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Team
        </Button>
      </div>
        )}

      <Table
        pagination={false}
        dataSource={teams}
        columns={columns}
        loading={loading}
        className="custom-table"
      />

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title="Create Team"
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTeam} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input the team name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: 'Please input the team description' },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            label="Team Leader"
            name="leadId"
            rules={[
              { required: true, message: 'Please select the team leader' },
            ]}
          >
            <Select>
              {teamLeaders.map((leader) => (
                <Select.Option key={leader.id} value={leader.id}>
                  {leader.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Labours"
            name="labourIds"
            rules={[{ required: true, message: 'Please select the labours' }]}
          >
            <Select mode="multiple">
              {labours.map((labour) => (
                <Select.Option key={labour.id} value={labour.id}>
                  {labour.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Create Team
          </Button>
        </Form>
      </Modal>
    </ParentLayout>
  );
};

export { Teams };
