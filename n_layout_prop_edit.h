#ifndef N_LAYOUT_PROP_EDIT_H
#define N_LAYOUT_PROP_EDIT_H

#include "util/n_json.h"
#include "native_bridge.h"

#include <QWidget>
#include <QVariantMap>

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
    void setViewFromJS(const NJson &view);
    void setViewPosFromJS(const int &x, const int &y);
    void syncWidgetToJson();

private:
    Ui::NLayoutPropEdit *ui;
    NJson mView;
    NativeBridge *mNative;

    void hideAllExtraPropWidget();
    void showExtraPropWidget(QString className);
    void connectWidgetToJson();
    void disconnectWidgetToJson();
};

#endif // N_LAYOUT_PROP_EDIT_H
