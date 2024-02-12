import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';

const API_ENDPOINT =
  'https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&per_page=20&page=1&api_key=6f102c62f41998d151e5a1b48713cf13&format=json&nojsoncallback=1&extras=url_s';

const App = () => {
  const [images, setImages] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const scaleValue = useState(new Animated.Value(1))[0];

  const loadData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedImages');
      if (cachedData !== null) {
        setImages(shuffleArray(JSON.parse(cachedData)));
      }
      const response = await axios.get(API_ENDPOINT);
      const fetchedImages = response.data.photos.photo;
      setImages(shuffleArray(fetchedImages));
      await AsyncStorage.setItem('cachedImages', JSON.stringify(fetchedImages));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('cachedImages');
        if (cachedData !== null) {
          setImages(shuffleArray(JSON.parse(cachedData)));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      loadData();
    }
  }, [isOnline]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={loadData} style={styles.navButton}>
          <Icon name="home" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.gallery}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            {images.map((image, index) => (
              <TouchableOpacity
                key={image.id}
                onPress={() => setSelectedImage(image)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Animated.Image
                  source={{ uri: image.url_s }}
                  style={[
                    styles.image,
                    {
                      transform: [{ scale: scaleValue }],
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
      {selectedImage && (
        <View style={styles.fullImageContainer}>
          <Image source={{ uri: selectedImage.url_s }} style={styles.fullImage} />
        </View>
      )}
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
  },
  gallery: {
    paddingTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  image: {
    width: (windowWidth - 48) / 2,
    height: 200,
    marginVertical: 6,
    borderRadius: 5,
    resizeMode: 'cover',
  },
  fullImageContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
});

export default App;
