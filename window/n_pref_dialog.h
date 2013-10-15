#ifndef N_PREF_DIALOG_H
#define N_PREF_DIALOG_H

#include <QDialog>
#include <QSettings>

namespace Ui {
class NPrefDialog;
}

class NPrefDialog : public QDialog
{
    Q_OBJECT

public:
    static const QString DONE_PREFERENCE;
    static const QString PREVIEW_GOOGLE_CHROME_PATH;
    static const QString PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE;
    static const QString PREVIEW_DISABLE_WEB_SECURITY;
    static const QString PREVIEW_USER_DATA_DIR;
    static const QString PREVIEW_OTHER_OPTIONS;

public:
    explicit NPrefDialog(QWidget *parent = 0);
    QSettings *getSettings();
    ~NPrefDialog();

public slots:
    virtual int exec();
    virtual void accept();

private:
    Ui::NPrefDialog *ui;
    QSettings mSettings;

    void syncSettingsToWidget();
    void syncWidgetToSettings();
    bool validate();
};

#endif // N_PREF_DIALOG_H
