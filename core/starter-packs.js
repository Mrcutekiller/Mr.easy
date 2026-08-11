/**
 * MR.easy Starter Packs & Intent Pattern Matcher
 * Generates semantic MR.easy starter templates from user descriptions.
 */

'use strict';

const STARTER_PACKS = {
  cafe: {
    name: 'Coffee Shop & Bakery Starter Pack',
    category: 'Food & Hospitality',
    description: 'Hero, menu sections, product cards, prices, and WhatsApp ordering.',
    source: `Mr.easy "Mulu Cafe & Bakery"

hero "Mulu Cafe" "Fresh Ethiopian Coffee & Daily Bakery" "Order on WhatsApp" green
  badge "Addis Ababa, Ethiopia"

section "Popular Menu"
  grid cols:3
    card shadow
      title "Special Espresso"
      text "100% Arabica dark roast"
      text "120 ETB" bold
      button "Order Espresso" green
    end

    card shadow
      title "Macchiato"
      text "Steamed milk & espresso shot"
      text "90 ETB" bold
      button "Order Macchiato" green
    end

    card shadow
      title "Homemade Cake"
      text "Fresh chocolate layer cake"
      text "180 ETB" bold
      button "Order Cake" green
    end
  end

section "Visit Us"
  text "Bole Road, near Mega Building, Addis Ababa"
  text "Open daily: 7:00 AM – 9:00 PM"

footer "© 2026 Mulu Cafe. Built with MR.easy 🇪🇹"
`
  },

  school: {
    name: 'Small School & Academy Starter Pack',
    category: 'Education',
    description: 'Welcome section, programs offered, admissions info, and contact details.',
    source: `Mr.easy "Ethio Academy School"

hero "Ethio Academy" "Nurturing Tomorrow's Leaders Today" "Apply for Admission" blue
  badge "KKG to Grade 12"

section "Our Programs"
  grid cols:2
    card shadow
      title "Primary School (Grade 1-8)"
      text "Comprehensive STEM, languages, and character building."
    end
    card shadow
      title "High School (Grade 9-12)"
      text "Advanced college prep, computer lab, and science fairs."
    end
  end

section "Admissions 2026"
  text "Enrollment is now open for the upcoming academic year."
  button "Download Admission Form" blue

footer "Ethio Academy • Tel: +251 911 000 000 • Addis Ababa"
`
  },

  clinic: {
    name: 'Clinic & Healthcare Center Starter Pack',
    category: 'Healthcare',
    description: 'Emergency contacts, medical services, doctor schedules, and appointment booking.',
    source: `Mr.easy "Selam Medical Clinic"

hero "Selam Medical Clinic" "Quality Healthcare for Your Whole Family" "Book Appointment" green
  badge "24/7 Emergency Care"

section "Medical Services"
  grid cols:3
    card shadow
      title "General Pediatrics"
      text "Child health exams & immunizations"
    end
    card shadow
      title "Internal Medicine"
      text "Chronic disease management & diagnostics"
    end
    card shadow
      title "Dental Clinic"
      text "Cleanings, fillings, & oral surgery"
    end
  end

section "Contact & Emergency"
  text "Emergency Line: 991 / +251 116 000 000"
  text "Location: Kazanchis, near ECA, Addis Ababa"

footer "Selam Medical Clinic • Dedicated to Compassionate Care"
`
  },

  business: {
    name: 'Small Business & Agency Starter Pack',
    category: 'Business',
    description: 'Services grid, client testimonials, quote request form, and contact info.',
    source: `Mr.easy "Addis Digital Agency"

hero "Addis Digital Agency" "We Build High-Impact Digital Solutions" "Request Free Quote" purple

section "What We Do"
  grid cols:3
    card shadow
      title "Website Design"
      text "Fast, responsive websites built with MR.easy"
    end
    card shadow
      title "Branding & Logos"
      text "Memorable brand identities for small businesses"
    end
    card shadow
      title "Social Media"
      text "Content strategy & targeted growth"
    end
  end

footer "Addis Digital Agency • Addis Ababa, Ethiopia"
`
  }
};

function matchStarterPack(query) {
  if (!query || typeof query !== 'string') return STARTER_PACKS.cafe;
  const q = query.toLowerCase();

  if (q.includes('coffee') || q.includes('cafe') || q.includes('bakery') || q.includes('food') || q.includes('menu') || q.includes('restaurant')) {
    return STARTER_PACKS.cafe;
  }
  if (q.includes('school') || q.includes('student') || q.includes('class') || q.includes('teacher')) {
    return STARTER_PACKS.school;
  }
  if (q.includes('clinic') || q.includes('hospital') || q.includes('health') || q.includes('doctor')) {
    return STARTER_PACKS.clinic;
  }
  if (q.includes('agency') || q.includes('business') || q.includes('company') || q.includes('shop')) {
    return STARTER_PACKS.business;
  }
  return STARTER_PACKS.cafe;
}

module.exports = { STARTER_PACKS, matchStarterPack };
