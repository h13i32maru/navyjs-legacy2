#ifndef N_LAYOUT_SETTING_DIALOG_H
#define N_LAYOUT_SETTING_DIALOG_H

#include <QDialog>

namespace Ui {
class NLayoutSettingDialog;
}

class NLayoutSettingDialog : public QDialog
{
    Q_OBJECT

    friend class NLayoutWidget;

public:
    explicit NLayoutSettingDialog(QWidget *parent = 0);
    ~NLayoutSettingDialog();

private:
    Ui::NLayoutSettingDialog *ui;
};

#endif // N_LAYOUT_SETTING_DIALOG_H
