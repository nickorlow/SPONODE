package crc6481ecfcd9ff64f0da;


public class NLService
	extends android.service.notification.NotificationListenerService
	implements
		mono.android.IGCUserPeer
{
/** @hide */
	public static final String __md_methods;
	static {
		__md_methods = 
			"n_onCreate:()V:GetOnCreateHandler\n" +
			"n_onDestroy:()V:GetOnDestroyHandler\n" +
			"n_onBind:(Landroid/content/Intent;)Landroid/os/IBinder;:GetOnBind_Landroid_content_Intent_Handler\n" +
			"n_onUnbind:(Landroid/content/Intent;)Z:GetOnUnbind_Landroid_content_Intent_Handler\n" +
			"n_onNotificationPosted:(Landroid/service/notification/StatusBarNotification;)V:GetOnNotificationPosted_Landroid_service_notification_StatusBarNotification_Handler\n" +
			"n_onNotificationRemoved:(Landroid/service/notification/StatusBarNotification;)V:GetOnNotificationRemoved_Landroid_service_notification_StatusBarNotification_Handler\n" +
			"";
		mono.android.Runtime.register ("SPONODE.NLService, SPONODE", NLService.class, __md_methods);
	}


	public NLService ()
	{
		super ();
		if (getClass () == NLService.class)
			mono.android.TypeManager.Activate ("SPONODE.NLService, SPONODE", "", this, new java.lang.Object[] {  });
	}


	public void onCreate ()
	{
		n_onCreate ();
	}

	private native void n_onCreate ();


	public void onDestroy ()
	{
		n_onDestroy ();
	}

	private native void n_onDestroy ();


	public android.os.IBinder onBind (android.content.Intent p0)
	{
		return n_onBind (p0);
	}

	private native android.os.IBinder n_onBind (android.content.Intent p0);


	public boolean onUnbind (android.content.Intent p0)
	{
		return n_onUnbind (p0);
	}

	private native boolean n_onUnbind (android.content.Intent p0);


	public void onNotificationPosted (android.service.notification.StatusBarNotification p0)
	{
		n_onNotificationPosted (p0);
	}

	private native void n_onNotificationPosted (android.service.notification.StatusBarNotification p0);


	public void onNotificationRemoved (android.service.notification.StatusBarNotification p0)
	{
		n_onNotificationRemoved (p0);
	}

	private native void n_onNotificationRemoved (android.service.notification.StatusBarNotification p0);

	private java.util.ArrayList refList;
	public void monodroidAddReference (java.lang.Object obj)
	{
		if (refList == null)
			refList = new java.util.ArrayList ();
		refList.add (obj);
	}

	public void monodroidClearReferences ()
	{
		if (refList != null)
			refList.clear ();
	}
}
