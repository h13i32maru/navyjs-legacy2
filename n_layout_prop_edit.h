#ifndef N_LAYOUT_PROP_EDIT_H
#define N_LAYOUT_PROP_EDIT_H

#include "n_json.h"
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
    explicit NLayoutPropEdit(QWidget *parent = 0);
    void setNativeBridge(NativeBridge *native);
    ~NLayoutPropEdit();

public slots:
    void setViewFromJS(const NJson &view);
    void syncWidgetToJson();

private:
    Ui::NLayoutPropEdit *ui;
    NJson mView;
    NativeBridge *mNative;

    void hideAllExtraPropWidget();
    void showExtraPropWidget(QString className);
};

#endif // N_LAYOUT_PROP_EDIT_H
