import {FaUserCircle} from 'react-icons/fa';

const Header = ({title}: {title: string}) => {
  return (
    <header className="flex bg-white! rounded-xl border border-[#E5E7EB] items-center justify-between px-6 py-4 shadow-[0px_0px_10px_0px_#E5E7EB]">
    <div className="flex items-center gap-4">
      <h2 className="text-md font-semibold bg-linear-to-r text-[#1F2937] ">
        {title}
      </h2>
    </div>

    <div className="flex items-center gap-3">
      <button className="p-1 rounded-full bg-linear-to-br from-gray-300 to-gray-400 text-white hover:scale-105 transition">
        <FaUserCircle size={30} />
      </button>
    </div>
  </header>
  )
}

export  {Header}
