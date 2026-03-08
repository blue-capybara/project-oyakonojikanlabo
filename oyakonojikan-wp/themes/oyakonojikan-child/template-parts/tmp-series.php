								<!-- posts -->
								<div class="postcards">
									<div class="postcards__image"><a href="<?php echo get_term_link($term); ?>"><img src="<?php if ($img_url) { ?><?php echo $img_url[0]; ?><?php } else { ?><?php echo get_stylesheet_directory_uri() ?>/assets/img/noimage.jpg<?php } ?>" alt="<?php echo $term->name; ?>"></a></div>
									<div class="postcards__inner">
										<div class="postcards__tags">
											<?php
											$tags = get_the_tags();
											if (!empty($tags)) {
												foreach ($tags as $tag) {
													printf(
														'<a href="%s">%s</a>',
														get_tag_link($tag->term_id),
														$tag->name
													);
												}
											}
											?>
										</div>
										<?php //keika_time(3); 
										?>
										<div class="postcards__title">
											<h2><a href="<?php echo get_term_link($term); ?>"><?php echo $term->name; ?></a></h2>
										</div>
									</div>
								</div>
								<!-- /posts -->