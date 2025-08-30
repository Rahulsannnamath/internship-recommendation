import React from 'react';
import { userProfile } from '../data/mockData.js';

const Profile = () => (
  <div className="view">
    <h1 className="page-title">Profile</h1>
    <p className="page-sub">Static placeholder.</p>
    <div className="panel">
      <pre className="code-block">{JSON.stringify(userProfile, null, 2)}</pre>
    </div>
  </div>
);

export default Profile;