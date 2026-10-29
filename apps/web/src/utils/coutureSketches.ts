export interface CoutureIllustration {
  title: string;
  subtitle: string;
  imageUrl: string;
  badge: string;
}

export function getCoutureSketchForGarment(
  garmentId?: string,
  styleName?: string,
): CoutureIllustration {
  const normGarment = (garmentId || '').toLowerCase().replace(/[-_\s]/g, '');
  const normStyle = (styleName || '').toLowerCase();

  if (normGarment.includes('overcoat') || normGarment.includes('coat')) {
    return {
      title: 'Architectural Overcoat Cut',
      subtitle: 'Double-Breasted Royal Atelier Pattern',
      imageUrl: '/images/styles/overcoat-double-breasted.jpg',
      badge: 'ATELIER COUTURE DRAFT',
    };
  }

  if (normGarment.includes('lehanga') || normGarment.includes('lehenga')) {
    return {
      title: 'Royal Bridal Lehenga Choli',
      subtitle: '16-Kali Paneled Flare with Marodi Zardozi',
      imageUrl: '/images/styles/lehenga-bridal.jpg',
      badge: 'HAUTE COUTURE DRAFT',
    };
  }

  if (
    normGarment.includes('chudidhar') ||
    normGarment.includes('anarkali') ||
    normGarment.includes('frock')
  ) {
    return {
      title: 'Royal Anarkali & Chudidhar Silhouette',
      subtitle: 'Bodice Specification with Mughal Archway Frame',
      imageUrl: '/images/styles/anarkali-couture.jpg',
      badge: 'ATELIER SPECIFICATION',
    };
  }

  // Blouse variants
  if (normStyle.includes('darted')) {
    return {
      title: 'Darted Silhouette Blouse',
      subtitle: 'Classic Tailored Cut with Antique Brocade Border',
      imageUrl: '/images/styles/blouse-darted.jpg',
      badge: 'ATELIER SPECIFICATION',
    };
  }

  if (normStyle.includes('katori')) {
    return {
      title: 'Katori Cut Blouse',
      subtitle: 'Contoured Cup Atelier Drafting',
      imageUrl: '/images/styles/blouse-katori-cut.jpg',
      badge: 'ATELIER SPECIFICATION',
    };
  }

  if (normStyle.includes('custom')) {
    return {
      title: 'Custom Atelier Cut',
      subtitle: 'Bespoke Haute Couture Pattern',
      imageUrl: '/images/styles/blouse-custom-sketch.jpg',
      badge: 'ATELIER SPECIFICATION',
    };
  }

  // Default blouse / ensemble
  return {
    title: 'Princess Cut Silhouette',
    subtitle: 'Royal Sweetheart Neckline & Gold Brocade',
    imageUrl: '/images/styles/blouse-princess-cut.jpg',
    badge: 'ATELIER SPECIFICATION',
  };
}
