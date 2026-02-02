import { ParentLayout } from '../../layout/ParentLayout';

const Dashboard = () => {

  return (
        <ParentLayout title="Dashboard">
          <div className="flex gap-8">
            {[
              {
                title: 'Ongoing Projects',
                value: '12 Active Sites',
              },
              {
                title: 'Team Members',
                value: '34 Engineers',
              },
              {
                title: 'Upcoming Deadlines',
                value: '5 Projects This Week',
              },
              {
                title: 'Upcoming Deadlines',
                value: '5 Projects This Week',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-linear-to-br w-1/4 from-black to-gray-700 rounded-xl shadow-xl p-6 border border-gray-700 hover:border-white/30 hover:shadow-2xl transition-transform duration-300"
              >
                <h3 className="text-md font-semibold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400">{card.value}</p>
              </div>
            ))}
          </div>
          </ParentLayout>
  );
};
export { Dashboard };