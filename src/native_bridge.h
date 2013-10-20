#ifndef NATIVE_BRIDGE_H
#define NATIVE_BRIDGE_H

#include "util/n_json.h"

#include <QObject>
#include <QList>
#include <QMap>
#include <QVariant>
#include <QVariantMap>

class NativeBridge : public QObject
{
    Q_OBJECT
public:
    explicit NativeBridge(QObject *parent = 0);
    void setLayoutPath(const QString &layoutPath);

    Q_INVOKABLE QString getLayoutPath() const;
    Q_INVOKABLE void setViewsFromJS(const QString &viewsJsonText);
    Q_INVOKABLE void setCurrentViewFromJS(const QString &viewJsonText);
    Q_INVOKABLE void setCurrentViewPosFromJS(const int &x, const int &y);
    Q_INVOKABLE void setCurrentViewSizeFromJS(const int &width, const int &height);

private:
    QString mLayoutPath;

signals:
    // すべてのViewの情報がJSから送信される(proxy)
    void viewsFromJS(const NJson &views);

    // 選択されたViewがJSから送信される(proxy)
    void currentViewFromJS(const NJson &json);

    // 現在選択されているViewの座標が移動した場合にJSから送信される(proxy)
    void currentViewPosFromJS(const int &x, const int &y);

    void currentViewSizeFromJS(const int &width, const int &height);

    // レイアウトの中が変更されたときに送信される
    void changedLayoutContentFromJS();

    // Viewのレイヤー順が変更された時にJSに送信される
    void changedViewsOrderToJS(const QStringList &viewIds);

    // Viewが選択されたときにJSに送信される
    void changedSelectedViewToJS(const QStringList &viewIds);

    // viewをすべて非選択状態にする
    void unselectAllViewsToJS();

    // Viewのプロパティが変更された時にJSに送信される
    void changedViewPropertyToJS(const QVariant &json);

    // Viewが追加されたときにJSに送信される
    void addViewToJS(const QString &viewId, const QString &viewClass);

    // Viewが削除された時にJSに送信される
    void deleteViewToJS(const QString &viewId);

    void deleteSelectedViewsToJS();

    // Scene, Pageの設定が変更された時にJSに送信される
    void setScreenToJS(const QString &sceneId, const QString &pageId);

    // Scene, Pageの有効無効が切り替わった時にJSに送信される
    void setScreenEnableToJS(const bool &enable);

    void alignSelectedViewsToJS(const QString &type);
    void arrangeSelectedViewsToJS(const QString &type);

public slots:

};

#endif // NATIVE_BRIDGE_H
