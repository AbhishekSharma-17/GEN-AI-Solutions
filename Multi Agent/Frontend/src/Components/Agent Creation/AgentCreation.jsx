import React, { useContext } from 'react';
import { AdminContext } from '../../Context/AdminContext';

const AgentCreation = () => {
  const { isAdminLoggedIn } = useContext(AdminContext);

  return (
    isAdminLoggedIn && (
      <div>
        {/* Add your agent creation content here */}
        <h1>Agent Creation Page</h1>
      </div>
    )
  );
};

export default AgentCreation;
