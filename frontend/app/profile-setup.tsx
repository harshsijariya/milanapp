import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { profileAPI, attachmentAPI } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DateTimePicker from '@react-native-community/datetimepicker';

const STEPS = [
  { title: 'Basic Info', icon: 'person' },
  { title: 'Contact', icon: 'call' },
  { title: 'Religion', icon: 'moon' },
  { title: 'Education', icon: 'school' },
  { title: 'Family', icon: 'people' },
];

const heightOptions = [{ label: 'Select', value: '' }];
for (let f = 4; f <= 7; f++) {
  for (let i = 0; i <= 11; i++) {
    if (f === 7 && i > 0) break;
    heightOptions.push({ label: `${f}' ${i}"`, value: `${f}' ${i}"` });
  }
}

const siblingOptions = [{ label: 'Select', value: '' }];
for (let i = 0; i <= 9; i++) {
  siblingOptions.push({ label: i.toString(), value: i.toString() });
}

const rashiOptions = [
  { label: 'Select', value: '' }, { label: 'Aries (Mesh)', value: 'Aries' }, { label: 'Taurus (Vrishabha)', value: 'Taurus' }, { label: 'Gemini (Mithun)', value: 'Gemini' }, { label: 'Cancer (Kark)', value: 'Cancer' }, { label: 'Leo (Simha)', value: 'Leo' }, { label: 'Virgo (Kanya)', value: 'Virgo' }, { label: 'Libra (Tula)', value: 'Libra' }, { label: 'Scorpio (Vrishchik)', value: 'Scorpio' }, { label: 'Sagittarius (Dhanu)', value: 'Sagittarius' }, { label: 'Capricorn (Makar)', value: 'Capricorn' }, { label: 'Aquarius (Kumbh)', value: 'Aquarius' }, { label: 'Pisces (Meen)', value: 'Pisces' },
];

const nakshatraOptions = [
  { label: 'Select', value: '' }, { label: 'Ashwini', value: 'Ashwini' }, { label: 'Bharani', value: 'Bharani' }, { label: 'Krittika', value: 'Krittika' }, { label: 'Rohini', value: 'Rohini' }, { label: 'Mrigashirsha', value: 'Mrigashirsha' }, { label: 'Ardra', value: 'Ardra' }, { label: 'Punarvasu', value: 'Punarvasu' }, { label: 'Pushya', value: 'Pushya' }, { label: 'Ashlesha', value: 'Ashlesha' }, { label: 'Magha', value: 'Magha' }, { label: 'Purva Phalguni', value: 'Purva Phalguni' }, { label: 'Uttara Phalguni', value: 'Uttara Phalguni' }, { label: 'Hasta', value: 'Hasta' }, { label: 'Chitra', value: 'Chitra' }, { label: 'Swati', value: 'Swati' }, { label: 'Vishakha', value: 'Vishakha' }, { label: 'Anuradha', value: 'Anuradha' }, { label: 'Jyeshtha', value: 'Jyeshtha' }, { label: 'Mula', value: 'Mula' }, { label: 'Purva Ashadha', value: 'Purva Ashadha' }, { label: 'Uttara Ashadha', value: 'Uttara Ashadha' }, { label: 'Shravana', value: 'Shravana' }, { label: 'Dhanishta', value: 'Dhanishta' }, { label: 'Shatabhisha', value: 'Shatabhisha' }, { label: 'Purva Bhadrapada', value: 'Purva Bhadrapada' }, { label: 'Uttara Bhadrapada', value: 'Uttara Bhadrapada' }, { label: 'Revati', value: 'Revati' }
];

const educationOptions = [
  { label: 'Select', value: '' }, { label: 'Doctor', value: 'Doctor' }, { label: 'CA', value: 'CA' }, { label: 'B.Tech', value: 'B.Tech' }, { label: 'Masters', value: 'Masters' }, { label: 'Bachelors', value: 'Bachelors' }, { label: 'Business', value: 'Business' }, { label: 'Other', value: 'Other' },
];

const incomeOptions = [
  { label: 'Select', value: '' }, { label: '0-5 Lakhs', value: '0-5 Lakhs' }, { label: '5-10 Lakhs', value: '5-10 Lakhs' }, { label: '10-15 Lakhs', value: '10-15 Lakhs' }, { label: '15-20 Lakhs', value: '15-20 Lakhs' }, { label: '20-25 Lakhs', value: '20-25 Lakhs' }, { label: '25-30 Lakhs', value: '25-30 Lakhs' }, { label: '30-35 Lakhs', value: '30-35 Lakhs' }, { label: '35-40 Lakhs', value: '35-40 Lakhs' }, { label: '40-50 Lakhs', value: '40-50 Lakhs' }, { label: '50-75 Lakhs', value: '50-75 Lakhs' }, { label: '75+ Lakhs', value: '75+ Lakhs' }, { label: '1 Crore+', value: '1 Crore+' },
];

const stateOptions = [
  { label: 'Select', value: '' }, { label: 'Andhra Pradesh', value: 'Andhra Pradesh' }, { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' }, { label: 'Assam', value: 'Assam' }, { label: 'Bihar', value: 'Bihar' }, { label: 'Chhattisgarh', value: 'Chhattisgarh' }, { label: 'Goa', value: 'Goa' }, { label: 'Gujarat', value: 'Gujarat' }, { label: 'Haryana', value: 'Haryana' }, { label: 'Himachal Pradesh', value: 'Himachal Pradesh' }, { label: 'Jharkhand', value: 'Jharkhand' }, { label: 'Karnataka', value: 'Karnataka' }, { label: 'Kerala', value: 'Kerala' }, { label: 'Madhya Pradesh', value: 'Madhya Pradesh' }, { label: 'Maharashtra', value: 'Maharashtra' }, { label: 'Manipur', value: 'Manipur' }, { label: 'Meghalaya', value: 'Meghalaya' }, { label: 'Mizoram', value: 'Mizoram' }, { label: 'Nagaland', value: 'Nagaland' }, { label: 'Odisha', value: 'Odisha' }, { label: 'Punjab', value: 'Punjab' }, { label: 'Rajasthan', value: 'Rajasthan' }, { label: 'Sikkim', value: 'Sikkim' }, { label: 'Tamil Nadu', value: 'Tamil Nadu' }, { label: 'Telangana', value: 'Telangana' }, { label: 'Tripura', value: 'Tripura' }, { label: 'Uttar Pradesh', value: 'Uttar Pradesh' }, { label: 'Uttarakhand', value: 'Uttarakhand' }, { label: 'West Bengal', value: 'West Bengal' }, { label: 'Delhi', value: 'Delhi' }
];

const cityOptions = [
  { label: 'Select', value: '' }, { label: 'Mumbai', value: 'Mumbai' }, { label: 'Delhi', value: 'Delhi' }, { label: 'Bangalore', value: 'Bangalore' }, { label: 'Hyderabad', value: 'Hyderabad' }, { label: 'Ahmedabad', value: 'Ahmedabad' }, { label: 'Chennai', value: 'Chennai' }, { label: 'Kolkata', value: 'Kolkata' }, { label: 'Surat', value: 'Surat' }, { label: 'Pune', value: 'Pune' }, { label: 'Jaipur', value: 'Jaipur' }, { label: 'Lucknow', value: 'Lucknow' }, { label: 'Kanpur', value: 'Kanpur' }, { label: 'Nagpur', value: 'Nagpur' }, { label: 'Indore', value: 'Indore' }, { label: 'Thane', value: 'Thane' }, { label: 'Bhopal', value: 'Bhopal' }, { label: 'Visakhapatnam', value: 'Visakhapatnam' }, { label: 'Pimpri-Chinchwad', value: 'Pimpri-Chinchwad' }, { label: 'Patna', value: 'Patna' }, { label: 'Vadodara', value: 'Vadodara' }, { label: 'Ghaziabad', value: 'Ghaziabad' }, { label: 'Ludhiana', value: 'Ludhiana' }, { label: 'Agra', value: 'Agra' }, { label: 'Nashik', value: 'Nashik' }, { label: 'Faridabad', value: 'Faridabad' }, { label: 'Meerut', value: 'Meerut' }, { label: 'Rajkot', value: 'Rajkot' }, { label: 'Kalyan-Dombivli', value: 'Kalyan-Dombivli' }, { label: 'Vasai-Virar', value: 'Vasai-Virar' }, { label: 'Varanasi', value: 'Varanasi' }
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Basic Info
  const [profileCreatedBy, setProfileCreatedBy] = useState('');
  const [gender, setGender] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [complexion, setComplexion] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [diet, setDiet] = useState('');
  const [disability, setDisability] = useState('No');
  const [profileImages, setProfileImages] = useState<string[]>([]);

  // Contact & Location
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // Religious/Astro
  const [gotra, setGotra] = useState('');
  const [aakna, setAakna] = useState('');
  const [motherTongue, setMotherTongue] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [manglik, setManglik] = useState('');
  const [nakshatra, setNakshatra] = useState('');

  // Education & Career
  const [education, setEducation] = useState('');
  const [educationDetail, setEducationDetail] = useState('');
  const [profession, setProfession] = useState('');
  const [occupationDetail, setOccupationDetail] = useState('');
  const [employedIn, setEmployedIn] = useState('');
  const [organization, setOrganization] = useState('');
  const [workCity, setWorkCity] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');

  // Family Details
  const [fathersName, setFathersName] = useState('');
  const [fathersOccupation, setFathersOccupation] = useState('');
  const [fathersContactNumber, setFathersContactNumber] = useState('');
  const [mothersName, setMothersName] = useState('');
  const [mothersOccupation, setMothersOccupation] = useState('');
  const [noOfMarriedBrothers, setNoOfMarriedBrothers] = useState('');
  const [noOfUnmarriedBrothers, setNoOfUnmarriedBrothers] = useState('');
  const [noOfMarriedSisters, setNoOfMarriedSisters] = useState('');
  const [noOfUnmarriedSisters, setNoOfUnmarriedSisters] = useState('');
  const [maternalUnclesName, setMaternalUnclesName] = useState('');
  const [maternalUnclesAakna, setMaternalUnclesAakna] = useState('');
  const [houseStatus, setHouseStatus] = useState('');
  const [carStatus, setCarStatus] = useState('');
  const [partnerPreferences, setPartnerPreferences] = useState('');
  const [aboutMyself, setAboutMyself] = useState('');

  useEffect(() => {
    fetchStepData(step);
  }, [step]);

  const fetchStepData = async (currentStep: number) => {
    try {
      setLoading(true);
      const tempDob = await AsyncStorage.getItem('temp_dob');
      const tempMobile = await AsyncStorage.getItem('temp_mobile');
      
      if (currentStep === 1) {
        const response = await profileAPI.getBasicInfo();
        const data = response.data;
        if (data) {
          if (data.profileCreatedBy) setProfileCreatedBy(data.profileCreatedBy);
          if (data.gender) setGender(data.gender);
          if (data.maritalStatus) setMaritalStatus(data.maritalStatus);
          if (data.dateOfBirth) {
            try {
              const dobDate = new Date(data.dateOfBirth);
              if (!isNaN(dobDate.getTime())) setDateOfBirth(dobDate);
            } catch (e) {}
          } else if (tempDob) {
            const dobDate = new Date(tempDob);
            if (!isNaN(dobDate.getTime())) setDateOfBirth(dobDate);
          }
          if (data.height) setHeight(data.height);
          if (data.weight) setWeight(data.weight.toString());
          if (data.complexion) setComplexion(data.complexion);
          if (data.bloodGroup) setBloodGroup(data.bloodGroup);
          if (data.diet) setDiet(data.diet);
          if (data.disability) setDisability(data.disability);
        } else if (tempDob) {
            setDateOfBirth(new Date(tempDob));
        }
      } else if (currentStep === 2) {
        const response = await profileAPI.getContactInfo();
        const data = response.data;
        if (data) {
          if (data.mobileNo) setMobileNumber(data.mobileNo);
          else if (tempMobile) setMobileNumber(tempMobile);
          if (data.whatsappNo) setWhatsappNumber(data.whatsappNo);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
          if (data.country) setCountry(data.country);
          if (data.presentAddress) setPresentAddress(data.presentAddress);
          if (data.permanentAddress) setPermanentAddress(data.permanentAddress);
        } else if (tempMobile) {
            setMobileNumber(tempMobile);
        }
      } else if (currentStep === 3) {
        const response = await profileAPI.getReligionInfo();
        const data = response.data;
        if (data) {
          if (data.gotra) setGotra(data.gotra);
          if (data.aakna) setAakna(data.aakna);
          if (data.motherTongue) setMotherTongue(data.motherTongue);
          if (data.timeOfBirth) setTimeOfBirth(data.timeOfBirth);
          if (data.placeOfBirth) setPlaceOfBirth(data.placeOfBirth);
          if (data.zodiac) setZodiac(data.zodiac);
          if (data.manglik) setManglik(data.manglik);
          if (data.nakshatra) setNakshatra(data.nakshatra);
        }
      } else if (currentStep === 4) {
        const response = await profileAPI.getEducationInfo();
        const data = response.data;
        if (data) {
          if (data.education) setEducation(data.education);
          if (data.educationDetails) setEducationDetail(data.educationDetails);
          if (data.profession) setProfession(data.profession);
          if (data.occupationDetails) setOccupationDetail(data.occupationDetails);
          if (data.annualIncome) setAnnualIncome(data.annualIncome);
          if (data.employedIn) setEmployedIn(data.employedIn);
          if (data.organization) setOrganization(data.organization);
          if (data.workCity) setWorkCity(data.workCity);
        }
      } else if (currentStep === 5) {
        const response = await profileAPI.getFamilyInfo();
        const data = response.data;
        if (data) {
          if (data.fathersName) setFathersName(data.fathersName);
          if (data.fathersOccupation) setFathersOccupation(data.fathersOccupation);
          if (data.fathersContactNo) setFathersContactNumber(data.fathersContactNo);
          if (data.mothersName) setMothersName(data.mothersName);
          if (data.mothersOccupation) setMothersOccupation(data.mothersOccupation);
          if (data.marriedBrothers !== null && data.marriedBrothers !== undefined) setNoOfMarriedBrothers(data.marriedBrothers.toString());
          if (data.unmarriedBrothers !== null && data.unmarriedBrothers !== undefined) setNoOfUnmarriedBrothers(data.unmarriedBrothers.toString());
          if (data.marriedSisters !== null && data.marriedSisters !== undefined) setNoOfMarriedSisters(data.marriedSisters.toString());
          if (data.unmarriedSisters !== null && data.unmarriedSisters !== undefined) setNoOfUnmarriedSisters(data.unmarriedSisters.toString());
          if (data.maternalUnclesName) setMaternalUnclesName(data.maternalUnclesName);
          if (data.maternalUnclesAakna) setMaternalUnclesAakna(data.maternalUnclesAakna);
          if (data.houseStatus) setHouseStatus(data.houseStatus);
          if (data.carStatus) setCarStatus(data.carStatus);
          if (data.partnerPreferences) setPartnerPreferences(data.partnerPreferences);
          if (data.aboutMyself) setAboutMyself(data.aboutMyself);
        }
      }
    } catch (error) {
      console.log('Failed to fetch profile', error);
      if (currentStep === 1) {
          const tempDob = await AsyncStorage.getItem('temp_dob');
          if (tempDob) setDateOfBirth(new Date(tempDob));
      }
      if (currentStep === 2) {
          const tempMobile = await AsyncStorage.getItem('temp_mobile');
          if (tempMobile) setMobileNumber(tempMobile);
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (profileImages.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setLoading(true);
      try {
        const uri = result.assets[0].uri;
        const fileName = uri.split('/').pop() || 'profile.jpg';
        const fileType = 'image/jpeg'; // or deduce from extension

        // 1. Get signed URL from backend
        const response = await attachmentAPI.generateUploadUrl(fileType, fileName);
        const { presignedUrl, s3Key } = response.data;

        // 2. Fetch the local file as blob
        const fileResponse = await fetch(uri);
        const blob = await fileResponse.blob();

        // 3. Upload to S3
        await fetch(presignedUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': fileType,
          },
        });

        // 4. On success, we just store the URL or key in our state
        // To show it immediately, we can use the original local uri for preview,
        // or re-fetch the GET signed url if we had an endpoint for it.
        // Actually, since S3 might need a GET signed URL, and we don't have it directly from the upload response (it gave a PUT url),
        // wait! The `UploadUrlResponseDto` has the `s3Key`. We could just put the local uri in state for preview,
        // but it's simpler to just add `s3Key` or use the local `uri` for preview and pass `s3Key` to updateProfile if needed.
        // BUT wait, `profileImages` is fetched from backend. The backend currently maps `AttachmentDao`s.
        // The `AttachmentDao` is ALREADY saved by `generateUploadUrl`!
        // So the backend already knows about it. We just need to add the local URI to `profileImages` so the user can see what they just uploaded without refreshing.
        setProfileImages(prev => [...prev, uri]);

      } catch (error) {
        console.error('Upload failed', error);
        Alert.alert('Upload Failed', 'There was an error uploading your photo. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setProfileImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    // Validations
    if (step === 1) {
      if (weight && (parseInt(weight) < 35 || parseInt(weight) > 120)) {
        Alert.alert('Invalid Weight', 'Weight must be between 35 and 120 kg.');
        return;
      }
    } else if (step === 2) {
      if (mobileNumber && mobileNumber.length !== 10) {
        Alert.alert('Invalid Mobile', 'Mobile number must be exactly 10 digits.');
        return;
      }
      if (whatsappNumber && whatsappNumber.length !== 10) {
        Alert.alert('Invalid WhatsApp', 'WhatsApp number must be exactly 10 digits.');
        return;
      }
      if (permanentAddress && permanentAddress.length < 10) {
        Alert.alert('Invalid Address', 'Permanent address must be at least 10 characters.');
        return;
      }
    }
    
    setLoading(true);
    try {
      if (step === 1) {
        await profileAPI.updateBasicInfo({
          profileCreatedBy,
          gender,
          maritalStatus,
          dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] + 'T00:00:00' : null,
          height,
          weight: weight ? parseInt(weight) : null,
          complexion,
          bloodGroup,
          diet,
          disability,
        });
      } else if (step === 2) {
        await profileAPI.updateContactInfo({
          mobileNo: mobileNumber,
          whatsappNo: whatsappNumber,
          city,
          state,
          country,
          presentAddress,
          permanentAddress,
        });
      } else if (step === 3) {
        await profileAPI.updateReligionInfo({
          gotra,
          aakna,
          motherTongue,
          timeOfBirth,
          placeOfBirth,
          zodiac,
          manglik,
          nakshatra,
        });
      } else if (step === 4) {
        await profileAPI.updateEducationInfo({
          education,
          educationDetails: educationDetail,
          profession,
          occupationDetails: occupationDetail,
          employedIn,
          organization,
          workCity,
          annualIncome,
        });
      } else if (step === 5) {
        await profileAPI.updateFamilyInfo({
          fathersName,
          fathersOccupation,
          fathersContactNo: fathersContactNumber,
          mothersName,
          mothersOccupation,
          marriedBrothers: noOfMarriedBrothers && !isNaN(parseInt(noOfMarriedBrothers, 10)) ? parseInt(noOfMarriedBrothers, 10) : null,
          unmarriedBrothers: noOfUnmarriedBrothers && !isNaN(parseInt(noOfUnmarriedBrothers, 10)) ? parseInt(noOfUnmarriedBrothers, 10) : null,
          marriedSisters: noOfMarriedSisters && !isNaN(parseInt(noOfMarriedSisters, 10)) ? parseInt(noOfMarriedSisters, 10) : null,
          unmarriedSisters: noOfUnmarriedSisters && !isNaN(parseInt(noOfUnmarriedSisters, 10)) ? parseInt(noOfUnmarriedSisters, 10) : null,
          maternalUnclesName,
          maternalUnclesAakna,
          houseStatus,
          carStatus,
          partnerPreferences,
          aboutMyself,
        });
      }

      if (step < 5) {
        setStep(step + 1);
      } else {
        await AsyncStorage.removeItem('temp_dob');
        await AsyncStorage.removeItem('temp_mobile');
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save progress');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="profile-setup-back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <Text style={styles.headerSubtitle}>Step {step} of 5 — {STEPS[step - 1].title}</Text>
        </View>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <TouchableOpacity key={i} style={styles.stepItem} onPress={() => setStep(i + 1)} activeOpacity={0.7}>
            <View style={[styles.stepCircle, i + 1 === step && styles.stepCircleActive, i + 1 < step && styles.stepCircleDone]}>
              {i + 1 < step ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Ionicons name={s.icon as any} size={16} color={i + 1 === step ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
              )}
            </View>
            <Text style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive]}>{s.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <LinearGradient colors={['#EC4899', '#F43F5E']} style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>
      </View>

      {/* Form Content */}
      <View style={styles.formCard}>
        <KeyboardAwareScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={100}
        >
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <View testID="step-1-basic">
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.sectionIconCircle}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Basic Information</Text>
              </View>

              <TouchableOpacity testID="upload-photo-btn" style={styles.imageButtonWrapper} onPress={pickImage} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#EC4899', '#F43F5E']}
                  style={styles.imageButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="camera" size={22} color="#FFFFFF" />
                  <Text style={styles.imageButtonText}>
                    {profileImages.length > 0 ? `Add More Photos (${profileImages.length}/5)` : 'Upload Profile Photos'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Photo Preview Grid */}
              {profileImages.length > 0 && (
                <View style={styles.photoGrid}>
                  {profileImages.map((img, index) => (
                    <View key={index} style={styles.photoPreviewContainer}>
                      <Image source={{ uri: img }} style={styles.photoPreview} />
                      {index === 0 && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Main</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        testID={`remove-photo-${index}`}
                        style={styles.removePhotoButton}
                        onPress={() => removeImage(index)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.removePhotoGradient}>
                          <Ionicons name="close" size={14} color="#FFFFFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {profileImages.length < 5 && (
                    <TouchableOpacity style={styles.addPhotoPlaceholder} onPress={pickImage} activeOpacity={0.7}>
                      <Ionicons name="add" size={28} color="#8B5CF6" />
                      <Text style={styles.addPhotoText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Text style={styles.photoHint}>Upload up to 5 photos. First photo is your main profile picture. Photos are auto-cropped.</Text>

              <SectionLabel text="Profile Created By *" />
              <GradientPicker icon="person-add" selectedValue={profileCreatedBy} onValueChange={setProfileCreatedBy} title="Profile Created By"
                items={[{ label: 'Select', value: '' }, { label: 'Self', value: 'Self' }, { label: 'Parent', value: 'Parent' }, { label: 'Sibling', value: 'Sibling' }, { label: 'Friend', value: 'Friend' }, { label: 'Relative', value: 'Relative' }]}
              />

              <SectionLabel text="Gender *" />
              <RadioGroup options={['Male', 'Female']} selected={gender} onSelect={setGender} />

              <SectionLabel text="Marital Status *" />
              <GradientPicker icon="heart" selectedValue={maritalStatus} onValueChange={setMaritalStatus} title="Marital Status"
                items={[{ label: 'Select', value: '' }, { label: 'Never Married', value: 'Never Married' }, { label: 'Divorced', value: 'Divorced' }, { label: 'Widowed', value: 'Widowed' }, { label: 'Awaiting Divorce', value: 'Awaiting Divorce' }]}
              />

              <SectionLabel text="Date of Birth *" />
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                <View pointerEvents="none">
                  <GradientInput 
                    icon="calendar" 
                    placeholder="DD/MM/YYYY" 
                    value={dateOfBirth ? `${String(dateOfBirth.getDate()).padStart(2, '0')}/${String(dateOfBirth.getMonth() + 1).padStart(2, '0')}/${dateOfBirth.getFullYear()}` : ''} 
                    editable={false} 
                  />
                </View>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth || new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event: any, selectedDate?: Date) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDateOfBirth(selectedDate);
                    }
                  }}
                />
              )}

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <SectionLabel text="Height" />
                  <GradientPicker icon="resize" selectedValue={height} onValueChange={setHeight} title="Height" items={heightOptions} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SectionLabel text="Weight (kg)" />
                  <GradientInput icon="fitness" placeholder="60" value={weight} onChangeText={setWeight} keyboardType="numeric" />
                </View>
              </View>

              <SectionLabel text="Complexion" />
              <GradientPicker icon="color-palette" selectedValue={complexion} onValueChange={setComplexion} title="Complexion"
                items={[{ label: 'Select', value: '' }, { label: 'Fair', value: 'Fair' }, { label: 'Wheatish', value: 'Wheatish' }, { label: 'Dark', value: 'Dark' }]}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <SectionLabel text="Blood Group" />
                  <GradientPicker icon="water" selectedValue={bloodGroup} onValueChange={setBloodGroup} title="Blood Group"
                    items={[{ label: 'Select', value: '' }, { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' }, { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' }, { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' }, { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' }]}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SectionLabel text="Diet" />
                  <GradientPicker icon="restaurant" selectedValue={diet} onValueChange={setDiet} title="Diet"
                    items={[{ label: 'Select', value: '' }, { label: 'Vegetarian', value: 'Vegetarian' }, { label: 'Non-Veg', value: 'Non-Vegetarian' }, { label: 'Eggetarian', value: 'Eggetarian' }]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Contact & Location */}
          {step === 2 && (
            <View testID="step-2-contact">
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.sectionIconCircle}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Contact & Location</Text>
              </View>
              <SectionLabel text="Mobile Number *" />
              <GradientInput icon="call" value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" placeholder="+91 XXXXX XXXXX" />
              <SectionLabel text="WhatsApp Number" />
              <GradientInput icon="logo-whatsapp" placeholder="+91 XXXXX XXXXX" value={whatsappNumber} onChangeText={setWhatsappNumber} keyboardType="phone-pad" />
              <SectionLabel text="City *" />
              <GradientPicker icon="location" selectedValue={city} onValueChange={setCity} title="City" items={cityOptions} />
              <SectionLabel text="State *" />
              <GradientPicker icon="map" selectedValue={state} onValueChange={setState} title="State" items={stateOptions} />
              <SectionLabel text="Country" />
              <GradientPicker icon="globe" selectedValue={country} onValueChange={setCountry} title="Country" items={[{ label: 'Select', value: '' }, { label: 'India', value: 'India' }]} />
              <SectionLabel text="Present Address" />
              <GradientInput icon="home" placeholder="Enter present address" value={presentAddress} onChangeText={setPresentAddress} multiline numberOfLines={3} />
              <SectionLabel text="Permanent Address" />
              <GradientInput icon="business" placeholder="Enter permanent address" value={permanentAddress} onChangeText={setPermanentAddress} multiline numberOfLines={3} />
            </View>
          )}

          {/* Step 3: Religious / Social / Astro */}
          {step === 3 && (
            <View testID="step-3-religion">
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.sectionIconCircle}>
                  <Ionicons name="moon" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Religious / Social / Astro</Text>
              </View>
              <SectionLabel text="Gotra" />
              <GradientInput icon="book" placeholder="Enter gotra" value={gotra} onChangeText={setGotra} />
              <SectionLabel text="Aakna" />
              <GradientInput icon="library" placeholder="Enter aakna" value={aakna} onChangeText={setAakna} />
              <SectionLabel text="Mother Tongue" />
              <GradientInput icon="language" placeholder="Hindi, English, etc." value={motherTongue} onChangeText={setMotherTongue} />

              <SectionLabel text="Time of Birth" />
              <GradientInput icon="time" placeholder="HH:MM (e.g. 14:30)" value={timeOfBirth} onChangeText={setTimeOfBirth} />

              <SectionLabel text="Place of Birth" />
              <GradientInput icon="location" placeholder="City name" value={placeOfBirth} onChangeText={setPlaceOfBirth} />
              <SectionLabel text="Zodiac / Rashi" />
              <GradientPicker icon="star" selectedValue={zodiac} onValueChange={setZodiac} title="Zodiac / Rashi" items={rashiOptions} />
              <SectionLabel text="Manglik" />
              <GradientPicker icon="planet" selectedValue={manglik} onValueChange={setManglik} title="Manglik"
                items={[{ label: 'Select', value: '' }, { label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }, { label: 'Partial', value: 'Partial' }, { label: "Don't Know", value: "Don't Know" }]}
              />
              <SectionLabel text="Nakshatra" />
              <GradientPicker icon="sparkles" selectedValue={nakshatra} onValueChange={setNakshatra} title="Nakshatra" items={nakshatraOptions} />
            </View>
          )}

          {/* Step 4: Education & Career */}
          {step === 4 && (
            <View testID="step-4-education">
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.sectionIconCircle}>
                  <Ionicons name="school" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Education & Career</Text>
              </View>
              <SectionLabel text="Education" />
              <GradientPicker icon="school" selectedValue={education} onValueChange={setEducation} title="Education" items={educationOptions} />
              <SectionLabel text="Education Detail" />
              <GradientInput icon="document-text" placeholder="Computer Science Engineering" value={educationDetail} onChangeText={setEducationDetail} />
              <SectionLabel text="Profession" />
              <GradientInput icon="briefcase" placeholder="Software Engineer" value={profession} onChangeText={setProfession} />
              <SectionLabel text="Occupation Detail" />
              <GradientInput icon="business" placeholder="Lead Engineer at XYZ" value={occupationDetail} onChangeText={setOccupationDetail} />
              <SectionLabel text="Employed In" />
              <GradientPicker icon="briefcase" selectedValue={employedIn} onValueChange={setEmployedIn} title="Employed In"
                items={[{ label: 'Select', value: '' }, { label: 'Private', value: 'Private' }, { label: 'Government', value: 'Government' }, { label: 'Business', value: 'Business' }, { label: 'Self Employed', value: 'Self Employed' }, { label: 'Not Working', value: 'Not Working' }]}
              />
              <SectionLabel text="Organization" />
              <GradientInput icon="business" placeholder="Company name" value={organization} onChangeText={setOrganization} />
              <SectionLabel text="Work City" />
              <GradientInput icon="location" placeholder="City where you work" value={workCity} onChangeText={setWorkCity} />
              <SectionLabel text="Annual Income" />
              <GradientPicker icon="cash" selectedValue={annualIncome} onValueChange={setAnnualIncome} title="Annual Income" items={incomeOptions} />
            </View>
          )}

          {/* Step 5: Family & Partner Preferences */}
          {step === 5 && (
            <View testID="step-5-family">
              <View style={styles.sectionTitleRow}>
                <LinearGradient colors={['#EC4899', '#F43F5E']} style={styles.sectionIconCircle}>
                  <Ionicons name="people" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Family Details</Text>
              </View>
              <SectionLabel text="Father's Name" />
              <GradientInput icon="person" placeholder="Enter father's name" value={fathersName} onChangeText={setFathersName} />
              <SectionLabel text="Father's Occupation" />
              <GradientInput icon="briefcase" placeholder="Enter occupation" value={fathersOccupation} onChangeText={setFathersOccupation} />
              <SectionLabel text="Father's Contact" />
              <GradientInput icon="call" placeholder="+91 XXXXX XXXXX" value={fathersContactNumber} onChangeText={setFathersContactNumber} keyboardType="phone-pad" />
              <SectionLabel text="Mother's Name" />
              <GradientInput icon="person" placeholder="Enter mother's name" value={mothersName} onChangeText={setMothersName} />
              <SectionLabel text="Mother's Occupation" />
              <GradientInput icon="briefcase" placeholder="Enter occupation" value={mothersOccupation} onChangeText={setMothersOccupation} />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <SectionLabel text="Married Bros" />
                  <GradientPicker icon="people" selectedValue={noOfMarriedBrothers} onValueChange={setNoOfMarriedBrothers} title="Married Brothers" items={siblingOptions} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SectionLabel text="Unmarried Bros" />
                  <GradientPicker icon="people" selectedValue={noOfUnmarriedBrothers} onValueChange={setNoOfUnmarriedBrothers} title="Unmarried Brothers" items={siblingOptions} />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <SectionLabel text="Married Sisters" />
                  <GradientPicker icon="people" selectedValue={noOfMarriedSisters} onValueChange={setNoOfMarriedSisters} title="Married Sisters" items={siblingOptions} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SectionLabel text="Unmarried Sisters" />
                  <GradientPicker icon="people" selectedValue={noOfUnmarriedSisters} onValueChange={setNoOfUnmarriedSisters} title="Unmarried Sisters" items={siblingOptions} />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <SectionLabel text="House Status" />
                  <GradientPicker icon="home" selectedValue={houseStatus} onValueChange={setHouseStatus} title="House Status"
                    items={[{ label: 'Select', value: '' }, { label: 'Owned', value: 'Owned' }, { label: 'Rented', value: 'Rented' }]}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <SectionLabel text="Car Status" />
                  <GradientPicker icon="car" selectedValue={carStatus} onValueChange={setCarStatus} title="Car Status"
                    items={[{ label: 'Select', value: '' }, { label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                  />
                </View>
              </View>

              <View style={[styles.sectionTitleRow, { marginTop: 24 }]}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.sectionIconCircle}>
                  <Ionicons name="heart-circle" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Partner Preferences</Text>
              </View>
              <SectionLabel text="Partner Preferences" />
              <GradientInput icon="heart" placeholder="Describe your ideal partner..." value={partnerPreferences} onChangeText={setPartnerPreferences} multiline numberOfLines={4} />
              <SectionLabel text="About Myself" />
              <GradientInput icon="chatbubble-ellipses" placeholder="Tell something about yourself..." value={aboutMyself} onChangeText={setAboutMyself} multiline numberOfLines={4} />
            </View>
          )}
          <View style={{ height: 80 }} />
        </KeyboardAwareScrollView>
      </View>

      {/* Footer Buttons */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? Math.max(34, insets.bottom) : Math.max(24, insets.bottom + 10) }]}>
        {step > 1 && (
          <TouchableOpacity testID="profile-setup-back-btn" style={styles.backStepButton} onPress={() => setStep(step - 1)} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#6366F1" />
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity testID="profile-setup-next-btn" style={[styles.nextButtonWrapper, step === 1 && { flex: 1 }]} onPress={handleNext} disabled={loading} activeOpacity={0.8}>
          <LinearGradient
            colors={step === 5 ? ['#10B981', '#059669'] : ['#EC4899', '#F43F5E']}
            style={[styles.nextButton, loading && styles.buttonDisabled]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>{step === 5 ? 'Complete Profile' : 'Next'}</Text>
                <Ionicons name={step === 5 ? 'checkmark-circle' : 'arrow-forward'} size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const GradientInput = ({ icon, placeholder, value, onChangeText, keyboardType, editable, multiline, numberOfLines }: any) => (
  <View style={[styles.inputContainer, multiline && styles.inputContainerMultiline]}>
    <View style={styles.inputIconContainer}>
      <Ionicons name={icon || 'create'} size={18} color="#8B5CF6" />
    </View>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable !== false}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  </View>
);

const GradientPicker = ({ icon, selectedValue, onValueChange, items, title }: any) => (
  <View style={styles.pickerWrapper}>
    <View style={styles.pickerIconContainer}>
      <Ionicons name={icon || 'list'} size={18} color="#8B5CF6" />
    </View>
    <View style={styles.pickerContainer}>
      <Picker selectedValue={selectedValue} onValueChange={onValueChange} style={styles.picker} mode="dialog" prompt={title}>
        {items.map((item: any, idx: number) => (
          <Picker.Item key={idx} label={`   ${item.label}`} value={item.value} />
        ))}
      </Picker>
    </View>
  </View>
);

const RadioGroup = ({ options, selected, onSelect }: any) => (
  <View style={styles.radioGroup}>
    {options.map((opt: string) => (
      <TouchableOpacity
        key={opt}
        style={[styles.radioButton, selected === opt && styles.radioButtonActive]}
        onPress={() => onSelect(opt)}
        activeOpacity={0.8}
      >
        {selected === opt ? (
          <LinearGradient colors={['#EC4899', '#F43F5E']} style={styles.radioGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.radioTextActive}>{opt}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.radioText}>{opt}</Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

const SectionLabel = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: 8 },
  backButton: { marginRight: 12, padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepCircleActive: { backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 2, borderColor: '#FFFFFF' },
  stepCircleDone: { backgroundColor: '#10B981' },
  stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  stepLabelActive: { color: '#FFFFFF' },
  progressBarContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  formCard: { flex: 1, backgroundColor: '#F3F4F6', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  sectionIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6, marginTop: 12 },
  inputContainer: { backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  inputContainerMultiline: { alignItems: 'flex-start', paddingTop: 12 },
  inputIconContainer: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1F2937' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  pickerWrapper: { backgroundColor: '#FFFFFF', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, minHeight: 56 },
  pickerIconContainer: { marginRight: 6 },
  pickerContainer: { flex: 1, justifyContent: 'center' },
  picker: { height: 56, color: '#1F2937' },
  row: { flexDirection: 'row' },
  radioGroup: { flexDirection: 'row', gap: 12 },
  radioButton: { flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  radioButtonActive: { shadowColor: '#EC4899', shadowOpacity: 0.3, elevation: 4 },
  radioGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  radioText: { paddingVertical: 14, textAlign: 'center', fontSize: 15, color: '#6B7280', fontWeight: '600' },
  radioTextActive: { fontSize: 15, color: '#FFFFFF', fontWeight: 'bold' },
  imageButtonWrapper: { marginBottom: 8, shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  imageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  imageButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  photoPreviewContainer: { width: (Dimensions.get('window').width - 80) / 3, height: (Dimensions.get('window').width - 80) / 3 * 1.2, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photoPreview: { width: '100%', height: '100%', borderRadius: 12 },
  primaryBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#6366F1', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  primaryBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  removePhotoButton: { position: 'absolute', top: 4, right: 4 },
  removePhotoGradient: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addPhotoPlaceholder: { width: (Dimensions.get('window').width - 80) / 3, height: (Dimensions.get('window').width - 80) / 3 * 1.2, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  addPhotoText: { color: '#8B5CF6', fontSize: 12, fontWeight: '600', marginTop: 2 },
  photoHint: { color: '#9CA3AF', fontSize: 11, marginTop: 8, lineHeight: 16 },
  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 24, gap: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  backStepButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#6366F1', backgroundColor: '#FFFFFF' },
  backStepText: { color: '#6366F1', fontSize: 15, fontWeight: 'bold' },
  nextButtonWrapper: { flex: 1, shadowColor: '#EC4899', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  nextButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.6 },
});
