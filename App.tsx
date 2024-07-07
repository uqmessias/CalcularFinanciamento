/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TextStyle,
  ViewStyle,
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
  sectionMode?:
    | 'FOCUS_ON_DESCRIPTION'
    | 'FOCUS_ON_TITLE'
    | 'HIDDEN_DESCRIPTION';
  hiddenDescription?: boolean;
}>;

function Section({
  children,
  title,
  sectionMode = 'FOCUS_ON_DESCRIPTION',
}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  let containerStyle: ViewStyle = styles.sectionFocusOnDescriptionContainer;
  let titleStyle: TextStyle = styles.sectionFocusOnDescriptionTitle;
  let descriptionStyle: TextStyle | undefined =
    styles.sectionFocusOnDescriptionDescription;

  switch (sectionMode) {
    case 'FOCUS_ON_TITLE':
      containerStyle = styles.sectionFocusOnTitleContainer;
      titleStyle = styles.sectionFocusOnTitleTitle;
      descriptionStyle = styles.sectionFocusOnTitleDescription;
      break;
    case 'HIDDEN_DESCRIPTION':
      containerStyle = styles.sectionHiddenDescriptionContainer;
      titleStyle = styles.sectionHiddenDescriptionTitle;
      descriptionStyle = undefined;
      break;

    case 'FOCUS_ON_DESCRIPTION':
    default:
      containerStyle = styles.sectionFocusOnDescriptionContainer;
      titleStyle = styles.sectionFocusOnDescriptionTitle;
      descriptionStyle = styles.sectionFocusOnDescriptionDescription;
      break;
  }

  return (
    <View style={containerStyle}>
      <Text
        style={[titleStyle, {color: isDarkMode ? Colors.white : Colors.black}]}>
        {title}
      </Text>
      {sectionMode !== 'HIDDEN_DESCRIPTION' && (
        <Text
          style={[
            descriptionStyle,
            {color: isDarkMode ? Colors.light : Colors.dark},
          ]}>
          {children}
        </Text>
      )}
    </View>
  );
}

function ItemByItemMode() {
  return (
    <>
      <Section title="Tempo proposto de pagamento">30 anos</Section>
      <Section title="Tempo de pagamento amortizado">4 anos e 8 meses</Section>
      <Section title="Valor financiado">R$ 130.000,00</Section>
      <Section title="Valor pago no tempo proposto">R$ 346.654,34</Section>
      <Section title="Valor pago amortizado">R$ 166.805,36</Section>
      <Section title="Valor disponível para pagamento">R$ 3.000,00</Section>
      <Section title="Economia por amortizar">R$ 179.848,98</Section>
    </>
  );
}
function SummarizedMode() {
  return (
    <>
      <Section sectionMode="FOCUS_ON_TITLE" title="Tempo de pagamento">
        {'30 anos propostos\n4 anos e 8 meses amortizados'}
      </Section>
      <Section sectionMode="FOCUS_ON_TITLE" title="Valor">
        {[
          'R$ 130.000,00 financiado',
          'R$ 346.654,34 pago no tempo proposto',
          'R$ 3.000,00 disponível para pagamento',
          'R$ 166.805,36 pago ao amortizar',
          'R$ 166.805,36 pago ao amortizar',
          'R$ 179.848,98 de economia ao amortizar',
        ].join('\n')}
      </Section>
    </>
  );
}
function ByCategoryMode() {
  return (
    <>
      <Section sectionMode="HIDDEN_DESCRIPTION" title="Financiamento" />
      <Section title="Valor financiado">R$ 130.000,00</Section>
      <Section title="Valor disponível para pagamento">R$ 3.000,00</Section>
      <Section title="Tempo de pagamento">30 anos</Section>
      <Section title="Valor pago">R$ 346.654,34</Section>
      <Section title="CET">
        {'166,6572%\n11,6600% / ano\n0,9233% / mês'}
      </Section>

      <Section sectionMode="HIDDEN_DESCRIPTION" title="Amortização" />
      <Section title="Tempo de pagamento">4 anos e 8 meses</Section>
      <Section title="Valor pago">R$ 166.805,36</Section>
      <Section title="Economia">R$ 179.848,98</Section>
      <Section title="CET">{'28,3118%\n5,4873% / ano'}</Section>
    </>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [mode, setMode] = React.useState(0);
  const toggleMode = React.useCallback(() => {
    setMode(previousMode => (previousMode + 1) % 3);
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const contentContainerStyle = {
    paddingBottom: 50,
    backgroundColor: isDarkMode ? Colors.black : Colors.white,
  };

  let Mode = ItemByItemMode;

  switch (mode) {
    case 0:
      Mode = ItemByItemMode;
      break;
    case 1:
      Mode = SummarizedMode;
      break;
    case 2:
      Mode = ByCategoryMode;
      break;
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        contentContainerStyle={contentContainerStyle}>
        <Pressable onPress={toggleMode}>
          <Header />
        </Pressable>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Mode />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionFocusOnTitleContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionFocusOnTitleTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionFocusOnTitleDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },

  sectionFocusOnDescriptionContainer: {
    marginTop: 12,
    paddingHorizontal: 24,
  },
  sectionFocusOnDescriptionTitle: {
    fontSize: 18,
    fontWeight: '200',
  },
  sectionFocusOnDescriptionDescription: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '400',
  },

  sectionHiddenDescriptionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHiddenDescriptionTitle: {
    fontSize: 18,
    lineHeight: 18,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
