const MAUTIC_URL = process.env.MAUTIC_URL || 'http://89.117.60.144:8083';
const MAUTIC_USERNAME = process.env.MAUTIC_USERNAME;
const MAUTIC_PASSWORD = process.env.MAUTIC_PASSWORD;

interface MauticContact {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  tags?: string[];
}

async function getMauticAuth(): Promise<string> {
  if (!MAUTIC_USERNAME || !MAUTIC_PASSWORD) {
    throw new Error('Mautic credentials not configured');
  }
  return Buffer.from(`${MAUTIC_USERNAME}:${MAUTIC_PASSWORD}`).toString('base64');
}

export async function createContact(contact: MauticContact): Promise<void> {
  try {
    const auth = await getMauticAuth();
    
    await fetch(`${MAUTIC_URL}/api/contacts/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(contact),
    });
  } catch (error) {
    console.error('[Mautic] Create contact failed:', error);
  }
}

export async function addContactToSegment(email: string, segmentId: number): Promise<void> {
  try {
    const auth = await getMauticAuth();
    
    await fetch(`${MAUTIC_URL}/api/segments/${segmentId}/contact/${email}/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
  } catch (error) {
    console.error('[Mautic] Add to segment failed:', error);
  }
}

export async function trackLead(data: {
  email: string;
  source: string;
  campaign?: string;
}): Promise<void> {
  await createContact({
    email: data.email,
    tags: [data.source, data.campaign].filter(Boolean) as string[],
  });
}
