import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
    tapsNeeded: number;
    onOpen: () => void;
};

export default function TouchHotspot({ tapsNeeded, onOpen }: Props) {
    const [taps, setTaps] = useState(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (taps >= tapsNeeded) {
            onOpen();
            setTaps(0);
        }

        const id = setTimeout(() => setTaps(0), 1500);
        return () => clearTimeout(id);
    }, [taps, tapsNeeded, onOpen]);

    return (
        <Pressable
            onPress={() => setTaps((t) => t + 1)}
            style={[
                styles.hotspot,
                { top: insets.top },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    hotspot: {
        position: "absolute",
        left: 0,
        width: 64,
        height: 64,
        zIndex: 9999,
    },
});
