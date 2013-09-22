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
    //set json from js to ui
    void setJsonOfView(const QVariant &json);
    void syncWidgetToJson();

private:
    Ui::NLayoutPropEdit *ui;
    NJson mJson;
    NativeBridge *mNative;
};

#endif // N_LAYOUT_PROP_EDIT_H
