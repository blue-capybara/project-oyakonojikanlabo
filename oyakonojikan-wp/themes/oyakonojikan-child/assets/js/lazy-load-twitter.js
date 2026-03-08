function twitterLazyLoad(src) {

	const scriptTag = document.createElement('script');
	scriptTag.src = src;
	scriptTag.async = true;

	document.body.appendChild(scriptTag);
}

function doTwitterLazyLoad() {

	const twitterEmbed = document.getElementsByClassName('twitter-tweet');
	const instaEmbed = document.getElementsByClassName('instagram-media');
	try {
		if (twitterEmbed.length !== 0) twitterLazyLoad('https://platform.twitter.com/widgets.js');
		if (instaEmbed.length !== 0) twitterLazyLoad('//www.instagram.com/embed.js');
	} catch (error) {
		console.log(error);
	}
}
window.addEventListener('scroll', doTwitterLazyLoad, { once: true });