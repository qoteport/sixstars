
'use server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { SoftwareProducts } from '@/lib/placeholder-images';

// This is a placeholder for actual partner data.
// In a real app, you might fetch this from another source or have a predefined list.
const mockPartners = [
    { id: "partner_001", name: "Innovate Inc" },
    { id: "partner_002", name: "QuantumLeap Co" },
    { id: "partner_003", name: "Synergy Solutions" },
];

export async function initializeServerFirebase() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig, 'migration');
  }
  return getApp('migration');
}

/**
 * One-time migration script to move software product data from JSON to Firestore.
 * This should be run from a server environment.
 */
export async function migrateSoftwareToFirestore() {
  console.log('Starting software migration to Firestore...');

  const app = await initializeServerFirebase();
  const firestore = getFirestore(app);
  
  if (!firestore) {
    console.error('Firestore is not initialized. Aborting migration.');
    return { success: false, message: 'Firestore is not initialized.' };
  }

  const batch = writeBatch(firestore);
  const productsCollectionRef = collection(firestore, 'softwareProducts');

  for (const [index, product] of SoftwareProducts.entries()) {
    // 1. Create a reference for the new product document using its original ID
    const productDocRef = doc(productsCollectionRef, product.id);

    // Assign a partner ID based on index for mock purposes
    const partnerId = mockPartners[index % mockPartners.length].id;

    // 2. Prepare the main product data, omitting nested arrays
    const { reviews, pricingTiers, ...baseProductData } = product;

    const productDataForFirestore = {
      ...baseProductData,
      partnerId, // Add the link to the partner
      reviewCount: reviews.length,
      createdAt: new Date().toISOString(),
    };
    
    batch.set(productDocRef, productDataForFirestore);

    // 3. Add pricing tiers to a subcollection
    if (pricingTiers && pricingTiers.length > 0) {
      const pricingTiersRef = collection(productDocRef, 'pricingTiers');
      for (const tier of pricingTiers) {
        const newTierDocRef = doc(pricingTiersRef); // Auto-generate ID for tier
        batch.set(newTierDocRef, {
          ...tier,
          id: newTierDocRef.id,
        });
      }
    }

    // 4. Add reviews to a subcollection
    if (reviews && reviews.length > 0) {
        const reviewsRef = collection(productDocRef, 'reviews');
        for (const review of reviews) {
          const newReviewDocRef = doc(reviewsRef); // Auto-generate ID for review
          batch.set(newReviewDocRef, {
            ...review,
            id: newReviewDocRef.id,
            createdAt: new Date().toISOString(),
          });
        }
    }

    console.log(`Prepared product: ${product.name}`);
  }

  try {
    await batch.commit();
    console.log(`Successfully migrated ${SoftwareProducts.length} software products.`);
    return { success: true, message: `Successfully migrated ${SoftwareProducts.length} software products.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error committing batch:', errorMessage);
    return { success: false, message: `Error committing batch: ${errorMessage}` };
  }
}
