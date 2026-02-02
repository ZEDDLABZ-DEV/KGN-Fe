/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal, Form, Input, DatePicker, Select, Button, Space } from "antd";
import { useEffect, useState } from "react";
import { BiRupee } from "react-icons/bi";
import { Request } from "../../utils/Request";
import dayjs, { type Dayjs } from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface CreateProjectModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (payload: any) => void;
}

interface ProjectFormValues {
  name: string;
  description: string;
  managerId: string;
  teamId: string;
  status: "active" | "pending" | "completed";
  borderColor: "blue" | "orange" | "purple";
  timeline: [Dayjs, Dayjs];
  budget: string;
  location: string;
}

const SectionLabel = ({ text }: { text: string }) => (
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
    {text}
  </p>
);

export const CreateProjectModal = ({
  open,
  onCancel,
  onSubmit,
}: CreateProjectModalProps) => {
  const [form] = Form.useForm();

  const [managerOptions, setManagerOptions] = useState<any[]>([]);
  const [teamOptions, setTeamOptions] = useState<any[]>([]);

  const getManagerOptions = async () => {
    const res = await Request.get("/v1/api/users/list/managers");
    setManagerOptions(res.data);
  };

  const getTeamOptions = async () => {
    const res = await Request.get("/v1/api/teams/all");
    setTeamOptions(res.data);
  };

  const handleSubmit = (values: ProjectFormValues) => {
    console.log(values);
    const payload = {
      name: values.name,
      description: values.description,
      managerId: values.managerId,
      startDate: values.timeline[0],
      endDate: values.timeline[1],
      teamId: values.teamId,
      budget: values.budget,
      location: values.location,
    };

    onSubmit(payload);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  useEffect(() => {
    getManagerOptions();
    getTeamOptions();
  }, []);

  return (
    <Modal
      title="Create New Project"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={900}
      styles={{
        body: {
          padding: "32px 0px",
        },
      }}
      style={{ top: 40 }}
      className="max-md:mx-4"
    >
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          scrollToFirstError
          className="mt-2 space-y-6"
          initialValues={{
            status: "active",
            borderColor: "blue",
          }}
        >
          <SectionLabel text="Project Basics" />
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: "Please enter project name!" }]}
          >
            <Input placeholder="Enter project name" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Project Description"
            rules={[
              { required: true, message: "Please enter project description!" },
            ]}
          >
            <TextArea
              placeholder="Brief description of the project"
              autoSize={{ minRows: 4, maxRows: 6 }}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <SectionLabel text="Assignments" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              name="managerId"
              label="Manager Name"
              rules={[{ required: true, message: "Please select a manager!" }]}
            >
              <Select
                size="large"
                placeholder="Select manager"
                showSearch
                allowClear
              >
                {managerOptions.map((manager) => (
                  <Option key={manager.id} value={manager.id}>
                    {manager.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="teamId"
              label="Team"
              rules={[{ required: true, message: "Please select a team!" }]}
            >
              <Select
                size="large"
                placeholder="Select team"
                showSearch
                allowClear
              >
                {teamOptions.map((team) => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <SectionLabel text="Status & Appearance" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status!" }]}
            >
              <Select size="large" placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="pending">Pending</Option>
                <Option value="completed">Completed</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="borderColor"
              label="Border Color"
              rules={[
                { required: true, message: "Please select border color!" },
              ]}
            >
              <Select size="large" placeholder="Select border color">
                <Option value="blue">Blue</Option>
                <Option value="orange">Orange</Option>
                <Option value="purple">Purple</Option>
              </Select>
            </Form.Item>
          </div>

          <SectionLabel text="Timeline" />
          <Form.Item
            name="timeline"
            label="Project Duration"
            rules={[
              { required: true, message: "Please select project dates!" },
            ]}
          >
            <RangePicker
              size="large"
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(current) =>
                current && current.isBefore(dayjs().startOf("day"))
              }
            />
          </Form.Item>

          <SectionLabel text="Financials & Location" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              name="budget"
              label="Budget"
              rules={[{ required: true, message: "Please enter budget!" }]}
            >
              <Input
                placeholder="250000"
                size="large"
                prefix={<BiRupee color="#4B5563" />}
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: "Please enter location!" }]}
            >
              <Input placeholder="Enter location" size="large" />
            </Form.Item>
          </div>

          <Form.Item className="mb-0 mt-6">
            <Space className="w-full justify-end">
              <Button
                size="large"
                onClick={handleCancel}
                className="border border-[#4B5563]! text-[#4B5563]! hover:border-gray-400!"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                className="bg-[#4B5563]! hover:bg-gray-400!"
              >
                Create Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
