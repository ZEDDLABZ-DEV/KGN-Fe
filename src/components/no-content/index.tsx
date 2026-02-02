import { Button } from 'antd'
import Lottie from 'lottie-react'
import empty from "../../assets/Empty.json"
import { PlusOutlined } from '@ant-design/icons'


const NoContent = ({ title, description, buttonText, onClick }: { title: string, description: string, buttonText: string, onClick: () => void }) => {
  return (
    <div className="flex flex-1 flex-col gap-3 items-center justify-start py-20">
    <div className="flex flex-col gap-3 items-center justify-center">
      <Lottie animationData={empty} loop={true} className="w-40 h-40" />
      <div className="flex flex-col gap-1 items-center justify-center">
      <h4 className="text-xl font-semibold! text-gray-500!"> {title}</h4>
      <p className="text-gray-500! text-md!"> {description} Create one to get started.</p>
      </div>
      <Button
        type="primary"
        size="large"
        className="bg-[#4B5563]! hover:bg-gray-400!"
        icon={<PlusOutlined className="text-white" />}
        onClick={onClick}
      >
        {buttonText}
       
        
      </Button>
      </div>
  </div> 
  )
}

export { NoContent }