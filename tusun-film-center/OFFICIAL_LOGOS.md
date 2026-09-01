# 官方 Logo 来源与校验

下载页不使用占位图、近似图、重绘图或中心通用图标。下列网页 PNG 均为对应最终 App 官方 `ICNS` 的透明底 512 × 512 导出；页面测试固定校验 PNG，Swift 测试固定校验七份源 `ICNS`，防止后续被非官方素材替换。

| 序号 | 页面文件 | 工具 | 可复核的最终 App 来源 | 来源 ICNS SHA-256 | 页面 PNG SHA-256 |
| --- | --- | --- | --- | --- | --- |
| — | `tusun-film-center-icon.png` | 兔狲AI创作工作坊 | `apps/manager-macos/Assets/Branding/TusunFilmCenter.icns` | `7bc9530689a679a868e8da3a9dadfa183571cfece0b60b07861c86ccadd2ced0` | `ce71409e14e51df0c3c189ebd35b01300368f1b17d173f5af1b5282b2d7375cc` |
| 01 | `screenplay.png` | 兔狲剧本编辑器 | `/Applications/兔狲剧本编辑器.app/Contents/Resources/TusunScreenplay.icns` | `a3ef6254ad2c899b4635b64a0c68fcb340be3c2240aa59de049b7259c0dc0209` | `94a6f358a6a124110b2d329f8ee374a9dfe81c5e8d0c1df2f7c75495c2a5ef16` |
| 02 | `batchdesk.png` | 兔狲批量图生成台 | `~/Library/Application Support/TusunFilmCenter/components/tusun-batchdesk/1.1.10/兔狲批量图生成台（工作坊）.app/Contents/Resources/tusun-batchdesk.icns` | `6d0d1874f5b54b606095ff8dceabea14ee7eaffdf413c8619761b31e041b6fd0` | `c00dae18747f1618bafb0d4c8557349e3e404b4b3652567a1150ebe0df830a75` |
| 03 | `storyboard.png` | 兔狲分镜工作台 | OneDrive1 权威树 `13_STORYBOARD_WORKBENCH/skill/dist/macos/candidates/v1.0.7-build121/兔狲分镜工作台-Workshop.app/Contents/Resources/AppIcon.icns`（Build 121 官方透明图标） | `8a77550527163172ba42b33c04751a18210962d2fcdd1dc979b940e6b442ddfb` | `10ddf0e5c6d9727ad5d73907701b49923f390a5c0d6dfd1840c2cc6ca58d28c7` |
| 04 | `keyframe-generator.png` | 兔狲关键帧生成器 | OneDrive1 权威树 `14_KEYFRAME_WORKBENCH/dist/desktop/v0.6.1-build26-release/workshop/兔狲关键帧生成器 · 工作坊.app/Contents/Resources/AppIcon.icns`（Build 26 官方图标） | `6e3e1999030f397e3291e503fbdbe9c53e1b1d03fbab6c2f9ccb6931682b023b` | `b0a088178029308e5436fc15d767cedc5265f6bfc6f1a178ecb856c08bd03d58` |
| 05 | `keyframe-workbench.png` | 兔狲关键帧精调台 | `~/Library/Application Support/TusunFilmCenter/components/tusun-keyframe-workbench/0.2.1/兔狲关键帧精调台.app/Contents/Resources/AppIcon.icns` | `704039bb6e7aea8eea88ba1adc186ee6a3340500cdfff3c93f887f0f74e491b5` | `08b5693274e1b5426ac938ceff4b3f621f01d73ad6af18f89ceb1601d24c0021` |
| 06 | `voice.png` | 兔狲配音工作台 | `~/Library/Application Support/TusunFilmCenter/components/tusun-voice-studio/1.1.7/兔狲配音工作台.app/Contents/Resources/AppIcon.icns` | `17a377656f534b102481ce4956161a2cddfb5a38dcccf669d382c7e98ffa47e9` | `aa90b610f8dbc96c2646fee595e76dea95ea5b148eb8baddaebdbacbf7d32875` |
| 07 | `video.png` | 兔狲视频工作台 | `~/Library/Application Support/TusunFilmCenter/components/tusun-video-workbench/1.2.8/兔狲视频工作台.app/Contents/Resources/AppIcon.icns` | `d245f6a8416e16c52f1ff847f75b8fc78b320cb59d53aa2f9f008b8986c653b5` | `89e27ff263546714e4dab7dc09950fc09002c4a532a7c4249e01cfc260e07ff9` |

分镜工作台已换用 v1.0.7 Build 121 的官方透明图标，中心 App 使用完整 ICNS，网页使用其 512 × 512 透明导出，避免旧版四角白边。第 05 项和 v0.2.1 Build 6 来源 App 已统一为“兔狲关键帧精调台”，并继续使用同一份已固定摘要的官方图标。
