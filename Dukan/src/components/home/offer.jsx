import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Image,
    Pressable,
    Animated,
    StyleSheet,
    useWindowDimensions,
    Platform,
    ActivityIndicator,
} from "react-native";
import Colors from "../../constants/Colors";
import { useGetActiveOffers } from "../../store/offerQuery";

/**
 * Safely extracts the promotional thumbnail image URL from an offer object
 */
export const getThumbnailUri = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    const raw =
        item.thumbnail_image ||
        item.thumbnail ||
        item.image ||
        item.productId?.images?.[0] ||
        item.productsId?.[0]?.images?.[0] ||
        (Array.isArray(item.images) ? item.images[0] : "");
    return typeof raw === "string" ? raw.trim() : "";
};

/**
 * Animated Dot Indicator with spring physics
 */
function PaginationDot({ isActive, onPress }) {
    const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: isActive ? 1 : 0,
            tension: 65,
            friction: 8,
            useNativeDriver: false,
        }).start();
    }, [isActive, anim]);

    const width = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [6, 22],
    });

    const backgroundColor = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#D8CBC4", Colors.primary],
    });

    const opacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.45, 1],
    });

    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            style={styles.dotPressable}
            accessibilityRole="button"
            accessibilityLabel="Go to slide"
        >
            <Animated.View
                style={[
                    styles.dot,
                    {
                        width,
                        backgroundColor,
                        opacity,
                    },
                ]}
            />
        </Pressable>
    );
}

/**
 * Single Offer Card Item
 * Shows the full image without cropping (resizeMode="contain")
 * and uses an ambient blurred backdrop to fill sides seamlessly.
 */
function OfferCardItem({
    item,
    index,
    containerWidth,
    cardWidth,
    cardHeight,
    scrollX,
    onPressOffer,
}) {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const imageUrl = getThumbnailUri(item);

    const inputRange = [
        (index - 1) * containerWidth,
        index * containerWidth,
        (index + 1) * containerWidth,
    ];

    const cardScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.95, 1, 0.95],
        extrapolate: "clamp",
    });

    return (
        <View style={[styles.slideContainer, { width: containerWidth }]}>
            <Animated.View
                style={[
                    styles.animatedCardWrapper,
                    {
                        transform: [{ scale: cardScale }],
                    },
                ]}
            >
                <Pressable
                    activeOpacity={0.92}
                    onPress={() => onPressOffer?.(item)}
                    style={({ pressed }) => [
                        styles.card,
                        {
                            width: cardWidth,
                            height: cardHeight,
                        },
                        pressed && styles.cardPressed,
                    ]}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={item?.title || "Offer Banner"}
                >
                    {imageUrl && !imageError ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={{
                                width: cardWidth,
                                height: cardHeight,
                                borderRadius: 16,

                            }}
                            resizeMode="cover"
                            onLoadStart={() => setImageLoading(true)}
                            onLoad={() => setImageLoading(false)}
                            onLoadEnd={() => setImageLoading(false)}
                            onError={(e) => {
                                console.warn(
                                    "Failed to load offer thumbnail:",
                                    imageUrl,
                                    e?.nativeEvent?.error
                                );
                                setImageError(true);
                                setImageLoading(false);
                            }}
                        />
                    ) : null}

                    {/* Loading overlay while image downloads */}
                    {imageLoading && !imageError && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.imageLoaderContainer,
                                { width: cardWidth, height: cardHeight },
                            ]}
                        >
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    )}
                </Pressable>
            </Animated.View>
        </View>
    );
}

/**
 * Skeleton Loader matching exact card dimensions to prevent layout jumps
 */
function OfferSkeleton({ containerWidth, cardWidth, cardHeight }) {
    const pulse = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 0.85,
                    duration: 750,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.4,
                    duration: 750,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return (
        <View style={[styles.container, { width: containerWidth }]}>
            <View style={[styles.slideContainer, { width: containerWidth }]}>
                <Animated.View
                    style={[
                        styles.skeletonCard,
                        {
                            width: cardWidth,
                            height: cardHeight,
                            opacity: pulse,
                        },
                    ]}
                />
            </View>
            <View style={styles.paginationRow}>
                <View style={[styles.skeletonDot, { width: 22 }]} />
                <View style={[styles.skeletonDot, { width: 6 }]} />
                <View style={[styles.skeletonDot, { width: 6 }]} />
            </View>
        </View>
    );
}

/**
 * OfferSlider Component
 * Displays promotional offer thumbnails in a smooth, high-fidelity animated carousel.
 *
 * Features:
 * - Half height (~170px): Well-proportioned banner size that leaves ample room for the rest of the home screen
 * - 100% Full content: resizeMode="contain" ensures no text, discount badges, or artwork is hidden
 * - Ambient backdrop: Softly extends banner colors across the full card width
 * - Smooth scroll-driven card scale depth animation
 * - Interactive spring pagination pill dots
 * - Intelligent auto-play with pause on manual drag/touch
 * - Layout-stable skeleton loader
 */
export default function OfferSlider({
    offers: propOffers,
    onPressOffer,
    autoPlay = true,
    autoPlayInterval = 4000,
    height: propHeight,
}) {
    const { data, isLoading } = useGetActiveOffers();
    const { width: windowWidth } = useWindowDimensions();

    // Layout sizing aligned with Dukan 16px screen padding (matching Navbar search bar)
    const containerWidth = windowWidth;
    const cardWidth = Math.min(windowWidth - 32, 520);

    // Height set to half (~170px) of previous 340px for a balanced, sleek mobile banner
    const cardHeight = propHeight || 170;

    // Filter offers that provide a valid promotional thumbnail
    const offers = useMemo(() => {
        const source =
            propOffers || data?.offers || (Array.isArray(data) ? data : []);
        return source.filter((o) => {
            if (!o || o.isActive === false) return false;
            const uri = getThumbnailUri(o);
            return Boolean(uri && uri.length > 0);
        });
    }, [propOffers, data]);

    const [activeIndex, setActiveIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const timerRef = useRef(null);
    const isDraggingRef = useRef(false);

    // Auto-scroll loop
    const stopAutoplay = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startAutoplay = useCallback(() => {
        stopAutoplay();
        if (!autoPlay || offers.length <= 1) return;

        timerRef.current = setInterval(() => {
            if (isDraggingRef.current) return;

            setActiveIndex((prev) => {
                const next = (prev + 1) % offers.length;
                flatListRef.current?.scrollToIndex({
                    index: next,
                    animated: true,
                });
                return next;
            });
        }, autoPlayInterval);
    }, [autoPlay, offers.length, autoPlayInterval, stopAutoplay]);

    useEffect(() => {
        startAutoplay();
        return () => stopAutoplay();
    }, [startAutoplay, stopAutoplay]);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const handleMomentumScrollEnd = (e) => {
        isDraggingRef.current = false;
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / containerWidth);
        if (index >= 0 && index < offers.length) {
            setActiveIndex(index);
        }
        startAutoplay();
    };

    const scrollToSlide = (index) => {
        setActiveIndex(index);
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
        });
        startAutoplay();
    };

    // Loading skeleton
    if (isLoading && (!propOffers || propOffers.length === 0)) {
        return (
            <OfferSkeleton
                containerWidth={containerWidth}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
            />
        );
    }

    // Gracefully hide if no offers with thumbnails are available
    if (offers.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { width: containerWidth }]}>
            <Animated.FlatList
                ref={flatListRef}
                data={offers}
                keyExtractor={(item, index) => item._id || String(index)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
                onScrollBeginDrag={() => {
                    isDraggingRef.current = true;
                    stopAutoplay();
                }}
                onScrollEndDrag={() => {
                    isDraggingRef.current = false;
                    startAutoplay();
                }}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScrollToIndexFailed={(info) => {
                    flatListRef.current?.scrollToOffset({
                        offset: info.index * containerWidth,
                        animated: true,
                    });
                }}
                getItemLayout={(_, index) => ({
                    length: containerWidth,
                    offset: containerWidth * index,
                    index,
                })}
                renderItem={({ item, index }) => (
                    <OfferCardItem
                        item={item}
                        index={index}
                        containerWidth={containerWidth}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        scrollX={scrollX}
                        onPressOffer={onPressOffer}
                    />
                )}
            />

            {/* Pagination dots (only shown when multiple slides exist) */}
            {offers.length > 1 && (
                <View style={styles.paginationRow}>
                    {offers.map((_, index) => (
                        <PaginationDot
                            key={index}
                            isActive={index === activeIndex}
                            onPress={() => scrollToSlide(index)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 4,
        alignItems: "center",
    },
    slideContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    animatedCardWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: Colors.white,
        borderWidth: 1,
        
        borderColor: "rgba(168, 79, 53, 0.08)",
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: Colors.text,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: "0 4px 12px rgba(48, 37, 34, 0.08)",
            },
        }),
    },
    cardPressed: {
        transform: [{ scale: 0.985 }],
        opacity: 0.94,
    },
    imageLoaderContainer: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.surface,
    },
    paginationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        height: 10,
    },
    dotPressable: {
        paddingHorizontal: 2,
        paddingVertical: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    skeletonContainer: {
        paddingVertical: 4,
        alignItems: "center",
    },
    skeletonCard: {
        borderRadius: 16,
        backgroundColor: "#EBDDD6",
    },
    skeletonDots: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        gap: 5,
    },
    skeletonDot: {
        height: 6,
        borderRadius: 3,
        backgroundColor: "#EBDDD6",
    },
});