import React from 'react';

interface AttackStage {
  name: string;
  count: number;
  color: string;
  textColor: string;
}

const stages: AttackStage[] = [
  { name: 'Exposure', count: 2, color: 'bg-gray-200', textColor: 'text-black' },
  { name: 'Intrusion Attempt', count: 1, color: 'bg-gray-300', textColor: 'text-black' },
  { name: 'Compromise', count: 1, color: 'bg-gray-500', textColor: 'text-white' },
  { name: 'Privilege Escalation & Propagation', count: 1, color: 'bg-gray-600', textColor: 'text-white' },
  { name: 'Persistence', count: 3, color: 'bg-black', textColor: 'text-white' },
  { name: 'Impact', count: 7, color: 'bg-red-600', textColor: 'text-white' },
];

const AttackChain: React.FC = () => {
  return (
    <div className="w-full p-4">
      <div className="flex items-center">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex flex-col items-center flex-grow">
            <div className="flex w-full">
              <div
                className={`relative h-16 flex-grow flex items-center justify-center ${stage.color} ${stage.textColor} pl-8 pr-4`}
                style={{
                  clipPath: index === stages.length - 1 
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 1.5rem 50%)' 
                    : 'polygon(0 0, calc(100% - 1.5rem) 0, 100% 50%, calc(100% - 1.5rem) 100%, 0 100%, 1.5rem 50%)',
                }}
              >
                <span className="text-center font-semibold">{stage.name}</span>
              </div>
            </div>
            <div className="mt-2 w-full border rounded-md bg-white shadow-sm flex items-center justify-center h-24">
              <span className="text-5xl font-bold text-gray-800">{stage.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttackChain;
