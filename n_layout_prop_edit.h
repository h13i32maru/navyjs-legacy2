#ifndef N_LAYOUT_PROP_EDIT_H
#define N_LAYOUT_PROP_EDIT_H

#include "util/n_json.h"
#include "native_bridge.h"

#include <QWidget>
#include <QVariantMap>
#include <QCompleter>
#include <QStringListModel>
#include <QSortFilterProxyModel>

namespace Ui {
class NLayoutPropEdit;
}

class NLayoutPropEdit : public QWidget
{
    Q_OBJECT

public:
    static const QString ClassView;
    static const QString ClassText;
    static const QString ClassImage;
    static const QString ClassViewGroup;

public:
    explicit NLayoutPropEdit(QWidget *parent = 0);
    void setNativeBridge(NativeBridge *native);
    void refreshForActive();
    ~NLayoutPropEdit();

public slots:
    void setViewFromJS(const NJson &views);
    void setViewPosFromJS(const int &x, const int &y);
    void syncWidgetToJson();

private slots:
    void setLinkIdList();

private:
    Ui::NLayoutPropEdit *ui;
    NJson mView;
    NativeBridge *mNative;
    bool mWidgetSignalBlocked;
    QWidgetList mWidgetList;

    void hideAllExtraPropWidget();
    void showExtraPropWidget(QString className);
    void connectWidgetToJson();
    void blockAllSignals(bool block);
};

#endif // N_LAYOUT_PROP_EDIT_H
