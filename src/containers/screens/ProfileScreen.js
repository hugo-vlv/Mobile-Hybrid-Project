import React from 'react';
import {
  View, ScrollView, PanResponder, Image
} from 'react-native';
import {
  Avatar, Text, ListItem, Button
} from 'react-native-elements';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { connect } from 'react-redux';
import firebase from 'react-native-firebase';
import ImagePicker from 'react-native-image-picker';
import AV from '../../AppVariables';
import ErrorMessage from '../../utils/ErrorMessage';
import { uploadImage, logOutCurrentUser, getUserImage } from '../../services/firebase';

const database = firebase.database();

class ProfileScreen extends React.Component {
  static navigationOptions = {
    tabBarLabel: 'My Profile',
    tabBarIcon: ({ tintColor }) => (
      <View>
        <FontAwesomeIcon color={tintColor} size={20} name="user-circle" />
      </View>
    )
  };

  state = {
    profileError: false,
    eventList: [],
    photo: null,
  };

  constructor(props) {
    super(props);
    const { login } = this.props;
    getUserImage(`profileImage${login.uid}`).then((result) => {
      this.setState({ photo: result });
    });
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        if (dx > 30 || dx < -30 || dy > 30 || dy < -30) {
          return true;
        }
        return false;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        const { navigation } = props;
        if (gestureState.dx < -200) {
          navigation.navigate('About');
        } else if (gestureState.dx > 200) {
          navigation.navigate('Map');
        }
      }
    });
  }

  componentDidMount = async () => {
    const { login } = this.props;
    const { eventList } = this.state;

    try {
      const eventRef = database.ref('/Events');

      eventRef
        .orderByChild('owner')
        .equalTo(login.uid)
        .on('child_added', (snapshot) => {
          const dataEvent = snapshot.val();

          eventList.push({
            ...dataEvent,
            avatar_url:
              'https://i0.wp.com/menaentrepreneur.org/wp-content/uploads/2017/06/Event-management-1.png',
            subtitle: dataEvent.description
          });

          this.setState({
            eventList
          });
        });
    } catch (error) {
      this.setState({ profileError: error.message });
    }
  };

  goToSingleEvent = (event) => {
    const { navigation } = this.props;

    navigation.navigate('SingleEvent', { event });
  };

  handlelogOut = async () => {
    const { navigation } = this.props;
    logOutCurrentUser();
    navigation.navigate('Login');
  };

  handleUpload = async () => {
    const { login } = this.props;
    const options = {
      title: 'Select Avatar',
      customButtons: [{ name: 'fb', title: 'Choose Photo from Facebook' }],
      storageOptions: {
        skipBackup: true,
        path: 'images'
      }
    };
    await ImagePicker.showImagePicker(options, async (response) => {
      if (!response.didCancel) {
        await uploadImage(`profileImage${login.uid}`, response.uri);
        getUserImage(`profileImage${login.uid}`).then((result) => {
          this.setState({ photo: result });
        });
      }
    });
  };

  render() {
    const { login } = this.props;
    const { eventList, profileError, photo } = this.state;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ height: 225, backgroundColor: AV.primaryColor }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {photo ? (
              <Image
                source={{
                  uri: photo
                }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <Avatar size="large" rounded title="AN" />
            )}

            <Text style={{ marginTop: 10, color: 'white' }}>hugo.villevieille@epitech.eu</Text>
          </View>
        </View>

        <View>
          <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 25 }}>Vos Événements</Text>
        </View>
        <Button title="Upload Image" onPress={() => this.handleUpload()} />
        <Button
          title="Log out"
          onPress={() => {
            this.handlelogOut();
          }}
        />
        <ScrollView style={{ marginTop: 20 }}>
          {eventList.map((l, i) => (
            <ListItem
              topDivider={i === 0}
              bottomDivider
              chevron
              onPress={() => this.goToSingleEvent(l)}
              key={l.name}
              leftAvatar={{ source: { uri: l.avatar_url } }}
              title={l.name}
              subtitle={l.subtitle}
            />
          ))}
        </ScrollView>
        <ErrorMessage
          active={profileError}
          setOff={() => this.setState({ profileError: false })}
          errorText={profileError}
        />
      </View>
    );
  }
}

const mapStateToProps = (state) => {
  const { login } = state;
  return { login };
};

export default connect(mapStateToProps)(ProfileScreen);
