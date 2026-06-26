import React from 'react';
import Books from '../components/Books';
import Orders from '../components/Orders';


import { useNotifications } from '../hooks/useNotifications';
import NotificationToast from '../components/NotificationToast';

export default function ShippyBooks() {
  const { notifications, dismiss } = useNotifications();
  return (
      <div className="cv">
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
        <div className="cv-header">
     	  <h1>ShippyBooks</h1>
        </div>
        <div className="md" style={{ padding: '20px' }}>
          <Books />
          <hr style={{ margin: '20px 0' }} />
          <Orders />
       </div>
    </div>
  );

}
